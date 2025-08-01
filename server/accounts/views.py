from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ClothingItemSerializer,
    OutfitSerializer,
)
from .models import UserProfile, ClothingItem, Outfit
from PIL import Image
import io
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        UserProfile.objects.get_or_create(user=user)  # Ensure profile created
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
    except Exception:
        return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    data = request.data

    # Update username
    new_username = data.get('username', '').strip()
    if new_username and new_username != user.username:
        if User.objects.filter(username=new_username).exclude(id=user.id).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        user.username = new_username
        user.save()

    # Change password if requested
    if 'current_password' in data and 'new_password' in data:
        current_password = data['current_password']
        new_password = data['new_password']

        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()

        # Invalidate old tokens and create a new one
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
    else:
        token = None

    # Update profile fields
    if 'bio' in data:
        profile.bio = data['bio']

    # Update first and last names
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    user.save()
    profile.save()

    serializer = UserProfileSerializer(profile)
    response_data = serializer.data
    if token:
        response_data['new_token'] = token.key
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    if 'avatar' not in request.FILES:
        return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

    avatar_file = request.FILES['avatar']

    if not avatar_file.content_type.startswith('image/'):
        return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)

    if avatar_file.size > 5 * 1024 * 1024:
        return Response({'error': 'Image size must be less than 5MB'}, status=status.HTTP_400_BAD_REQUEST)

    # Check AWS config
    aws_configured = all([
        getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
    ])

    if not aws_configured:
        return Response({'error': 'AWS S3 not properly configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        image = Image.open(avatar_file)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.thumbnail((400, 400), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=85)
        output.seek(0)
        resized_file = InMemoryUploadedFile(
            output, 'ImageField', f"{avatar_file.name.split('.')[0]}.jpg",
            'image/jpeg', output.tell(), None
        )
    except Exception as e:
        return Response({'error': f'Image processing failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    # Delete old avatar file if exists
    if profile.avatar:
        profile.avatar.delete(save=False)

    profile.avatar = resized_file
    profile.save()

    serializer = UserProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def clothing_items(request):
    if request.method == 'GET':
        items = ClothingItem.objects.filter(user=request.user)
        serializer = ClothingItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = ClothingItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            clothing_item = serializer.save()
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
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = ClothingItemSerializer(item, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
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
        user_outfits = Outfit.objects.filter(user=request.user).order_by('-created_at')
        serializer = OutfitSerializer(user_outfits, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = OutfitSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            outfit = serializer.save()
            response_serializer = OutfitSerializer(outfit, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
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
        serializer = OutfitSerializer(outfit, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = OutfitSerializer(outfit, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            updated_outfit = serializer.save()
            response_serializer = OutfitSerializer(updated_outfit, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_200_OK)
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
        serializer = OutfitSerializer(outfit, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Outfit.DoesNotExist:
        return Response({'error': 'Outfit not found'}, status=status.HTTP_404_NOT_FOUND)
