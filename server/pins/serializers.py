from rest_framework import serializers
from .models import Pin, Category

class PinSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_avatar = serializers.CharField(source='author.profile.avatar', read_only=True)
    tags_list = serializers.SerializerMethodField()

    class Meta:
        model = Pin
        fields = [
            'id', 'title', 'description', 'image_url', 'width', 'height',
            'likes', 'saves', 'tags', 'tags_list', 'author', 'author_name',
            'author_avatar', 'created_at'
        ]
        read_only_fields = ['author', 'likes', 'saves']

    def get_tags_list(self, obj):
        return obj.get_tags_list()

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']