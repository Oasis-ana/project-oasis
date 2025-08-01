from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, ClothingItem, Outfit


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            data['user'] = user
        else:
            raise serializers.ValidationError('Must provide username and password')

        return data


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ('username', 'email', 'first_name', 'last_name', 'bio', 'avatar', 'followers_count', 'following_count', 'created_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            if instance.avatar:
                data['avatar'] = instance.avatar.url
            else:
                data['avatar'] = None
        except Exception as e:
            print(f"❌ Error getting avatar URL: {e}")
            data['avatar'] = None
        return data


class ClothingItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClothingItem
        fields = [
            'id', 'name', 'brand', 'size', 'color', 'category', 
            'image', 'image_url', 'tags', 'is_favorite', 'is_worn',
            'last_worn', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            if instance.image:
                data['image'] = instance.image.url
            elif instance.image_url:
                data['image'] = instance.image_url
            else:
                data['image'] = None
        except Exception as e:
            print(f"❌ Error getting clothing item image URL: {e}")
            data['image'] = None
        return data


class OutfitSerializer(serializers.ModelSerializer):
    items = serializers.PrimaryKeyRelatedField(many=True, queryset=ClothingItem.objects.all(), required=False)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Outfit
        fields = [
            'id', 'title', 'description', 'category', 'occasion',
            'image', 'tags', 'liked', 'created_at', 'updated_at',
            'items', 'user'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        print(f"🔍 OutfitSerializer.create called with data: {validated_data}")
        items = validated_data.pop('items', [])
        validated_data['user'] = self.context['request'].user
        try:
            outfit = Outfit.objects.create(**validated_data)
            outfit.items.set(items)
            print(f"✅ Outfit created successfully: {outfit.title}")
            return outfit
        except Exception as e:
            print(f"❌ Error in OutfitSerializer.create: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def update(self, instance, validated_data):
        print(f"🔍 OutfitSerializer.update called for outfit: {instance.title}")
        items = validated_data.pop('items', None)
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            if items is not None:
                instance.items.set(items)
            instance.save()
            print(f"✅ Outfit updated successfully: {instance.title}")
            return instance
        except Exception as e:
            print(f"❌ Error in OutfitSerializer.update: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    def to_representation(self, instance):
        """Customize the output representation"""
        try:
            data = super().to_representation(instance)

            # Safely handle image URL
            try:
                if instance.image:
                    data['image'] = instance.image.url
                else:
                    data['image'] = None
            except Exception as e:
                print(f"❌ Error getting outfit image URL for {instance.title}: {e}")
                data['image'] = None

            # Ensure tags is always a list
            if data.get('tags') is None:
                data['tags'] = []
            elif isinstance(data['tags'], str):
                data['tags'] = [tag.strip() for tag in data['tags'].split(',') if tag.strip()]

            return data

        except Exception as e:
            print(f"❌ Error in OutfitSerializer.to_representation: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'id': instance.id if hasattr(instance, 'id') else None,
                'title': instance.title if hasattr(instance, 'title') else 'Unknown',
                'description': instance.description if hasattr(instance, 'description') else '',
                'category': instance.category if hasattr(instance, 'category') else 'Casual',
                'occasion': instance.occasion if hasattr(instance, 'occasion') else '',
                'image': None,
                'tags': [],
                'liked': instance.liked if hasattr(instance, 'liked') else False,
                'created_at': instance.created_at if hasattr(instance, 'created_at') else None,
                'updated_at': instance.updated_at if hasattr(instance, 'updated_at') else None,
                'items': [],
                'user': instance.user.id if hasattr(instance, 'user') and instance.user else None,
            }
