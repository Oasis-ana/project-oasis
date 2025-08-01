from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.conf import settings
from PIL import Image
import io
import traceback

from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    ClothingItemSerializer, OutfitSerializer
)
from .models import UserProfile, ClothingItem, Outfit


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
    except:
        return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        # Update username
        if 'username' in request.data:
            new_username = request.data['username'].strip()
            if new_username and new_username != user.username:
                if User.objects.filter(username=new_username).exclude(id=user.id).exists():
                    return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
                user.username = new_username
                user.save()

        # Password update
        if 'current_password' in request.data and 'new_password' in request.data:
            if not user.check_password(request.data['current_password']):
                return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(request.data['new_password'])
            user.save()
            Token.objects.filter(user=user).delete()
            token = Token.objects.create(user=user)

        # Update profile fields
        for field in ['bio', 'first_name', 'last_name']:
            if field in request.data:
                setattr(user if field in ['first_name', 'last_name'] else profile, field, request.data[field])
        user.save()
        profile.save()

        serializer = UserProfileSerializer(profile)
        response_data = serializer.data
        if 'new_password' in request.data:
            response_data['new_token'] = token.key
        return Response(response_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    try:
        if 'avatar' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']

        if not avatar_file.content_type.startswith('image/') or avatar_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Invalid image format or size > 5MB'}, status=status.HTTP_400_BAD_REQUEST)

        image = Image.open(avatar_file)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.thumbnail((400, 400), Image.Resampling.LANCZOS)

        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85)
        output.seek(0)

        resized_file = InMemoryUploadedFile(output, 'ImageField', f"{avatar_file.name.split('.')[0]}.jpg",
                                            'image/jpeg', output.tell(), None)

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.avatar:
            profile.avatar.delete(save=False)
        profile.avatar = resized_file
        profile.save()

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    except Exception as e:
        traceback.print_exc()
        return Response({'error': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def clothing_items(request):
    if request.method == 'GET':
        items = ClothingItem.objects.filter(user=request.user)
        serializer = ClothingItemSerializer(items, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ClothingItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            item = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def clothing_item_detail(request, item_id):
    try:
        item = ClothingItem.objects.get(id=item_id, user=request.user)
    except ClothingItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ClothingItemSerializer(item)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = ClothingItemSerializer(item, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if item.image:
            item.image.delete()
        item.delete()
        return Response({'message': 'Item deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def outfits(request):
    if request.method == 'GET':
        outfits = Outfit.objects.filter(user=request.user).order_by('-created_at')
        serializer = OutfitSerializer(outfits, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = OutfitSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            outfit = serializer.save()
            return Response(OutfitSerializer(outfit, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def outfit_detail(request, outfit_id):
    try:
        outfit = Outfit.objects.get(id=outfit_id, user=request.user)
    except Outfit.DoesNotExist:
        return Response({'error': 'Outfit not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(OutfitSerializer(outfit, context={'request': request}).data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = OutfitSerializer(outfit, data=request.data, partial=(request.method == 'PATCH'), context={'request': request})
        if serializer.is_valid():
            updated_outfit = serializer.save()
            return Response(OutfitSerializer(updated_outfit, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if outfit.image:
            outfit.image.delete()
        outfit.delete()
        return Response({'message': 'Outfit deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_outfit(request, outfit_id):
    try:
        outfit = Outfit.objects.get(id=outfit_id, user=request.user)
        outfit.liked = not outfit.liked
        outfit.save()
        return Response(OutfitSerializer(outfit, context={'request': request}).data)
    except Outfit.DoesNotExist:
        return Response({'error': 'Outfit not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
