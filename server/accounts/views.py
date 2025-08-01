from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db import transaction
from django.core.exceptions import ValidationError
import logging
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer, ClothingItemSerializer, OutfitSerializer
from .models import UserProfile, ClothingItem, Outfit
from PIL import Image
import io
from django.core.files.uploadedfile import InMemoryUploadedFile


logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
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
        token, created = Token.objects.get_or_create(user=user)
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
    except Exception as e:
        logger.error(f"Logout error for user {request.user.id}: {str(e)}")
        return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Profile retrieval error for user {request.user.id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        with transaction.atomic():
            if 'username' in request.data:
                new_username = request.data['username'].strip()
                if new_username and new_username != request.user.username:
                    if User.objects.filter(username=new_username).exclude(id=request.user.id).exists():
                        return Response({
                            'error': 'Username already exists'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    request.user.username = new_username
                    request.user.save()
            
            if 'current_password' in request.data and 'new_password' in request.data:
                current_password = request.data['current_password']
                new_password = request.data['new_password']
                
                if not request.user.check_password(current_password):
                    return Response({
                        'error': 'Current password is incorrect'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                request.user.set_password(new_password)
                request.user.save()
                
                Token.objects.filter(user=request.user).delete()
                token = Token.objects.create(user=request.user)
            
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            if 'bio' in request.data:
                profile.bio = request.data['bio']
            
            if 'first_name' in request.data:
                request.user.first_name = request.data['first_name']
                request.user.save()
            
            if 'last_name' in request.data:
                request.user.last_name = request.data['last_name']
                request.user.save()
            
            profile.save()
            
            serializer = UserProfileSerializer(profile)
            response_data = serializer.data
            
            if 'current_password' in request.data and 'new_password' in request.data:
                response_data['new_token'] = token.key
            
            return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Profile update error for user {request.user.id}: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    try:
        logger.info(f"Starting avatar upload for user: {request.user.username}")
        
     
        if 'avatar' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        logger.info(f"File received: {avatar_file.name}, size: {avatar_file.size}, type: {avatar_file.content_type}")
        
        # Validate file type
        if not avatar_file.content_type.startswith('image/'):
            return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (5MB limit)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Image size must be less than 5MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check AWS configuration
        from django.conf import settings
        aws_configured = all([
            getattr(settings, 'AWS_ACCESS_KEY_ID', None), 
            getattr(settings, 'AWS_SECRET_ACCESS_KEY', None), 
            getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
        ])
        
        if not aws_configured:
            logger.error("AWS Configuration missing")
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
            logger.error(f"Image processing error: {e}")
            return Response({'error': f'Image processing failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
      
        try:
            with transaction.atomic():
                profile, created = UserProfile.objects.get_or_create(user=request.user)
                
               
                if profile.avatar:
                    try:
                        profile.avatar.delete(save=False)
                    except Exception as e:
                        logger.warning(f"Could not delete old avatar: {e}")
                
              
                profile.avatar = resized_file
                profile.save()
                
                serializer = UserProfileSerializer(profile)
                return Response(serializer.data, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"Avatar save error: {e}")
            return Response({'error': f'Avatar save failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Unexpected error in upload_avatar: {str(e)}")
        return Response({'error': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser]) 
def clothing_items(request):
    if request.method == 'GET':
        try:
            items = ClothingItem.objects.filter(user=request.user).select_related('user')
            serializer = ClothingItemSerializer(items, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching clothing items for user {request.user.id}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            serializer = ClothingItemSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                clothing_item = serializer.save()
                logger.info(f"Created clothing item: {clothing_item.name} for user {request.user.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating clothing item for user {request.user.id}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])  
def clothing_item_detail(request, item_id):
    try:
        item = ClothingItem.objects.select_related('user').get(id=item_id, user=request.user)
    except ClothingItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching clothing item {item_id} for user {request.user.id}: {str(e)}")
        return Response({'error': 'Database error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if request.method == 'GET':
        serializer = ClothingItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'PATCH']:
        try:
            partial = request.method == 'PATCH'
            serializer = ClothingItemSerializer(item, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated clothing item {item_id} for user {request.user.id}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating clothing item {item_id} for user {request.user.id}: {str(e)}")
            return Response({'error': 'Update failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            with transaction.atomic():
                # Delete associated file first (outside transaction for performance)
                if item.image:
                    try:
                        item.image.delete(save=False)
                        logger.info(f"Deleted image file for clothing item {item_id}")
                    except Exception as e:
                        logger.warning(f"Could not delete image file for item {item_id}: {e}")
                
                # Delete the database record
                item_name = item.name
                item.delete()
                logger.info(f"Deleted clothing item '{item_name}' (ID: {item_id}) for user {request.user.id}")
                
                return Response({'message': 'Item deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
                
        except Exception as e:
            logger.error(f"Error deleting clothing item {item_id} for user {request.user.id}: {str(e)}")
            return Response({'error': 'Delete failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def outfits(request):
    if request.method == 'GET':
        try:
            user_outfits = Outfit.objects.filter(user=request.user).select_related('user').prefetch_related('clothing_items')
            serializer = OutfitSerializer(user_outfits, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching outfits for user {request.user.id}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            serializer = OutfitSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                outfit = serializer.save()
                logger.info(f"Created outfit: {outfit.name} for user {request.user.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating outfit for user {request.user.id}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def outfit_detail(request, outfit_id):
    try:
        outfit = Outfit.objects.select_related('user').prefetch_related('clothing_items').get(id=outfit_id, user=request.user)
    except Outfit.DoesNotExist:
        return Response({'error': 'Outfit not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching outfit {outfit_id} for user {request.user.id}: {str(e)}")
        return Response({'error': 'Database error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if request.method == 'GET':
        serializer = OutfitSerializer(outfit)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'PATCH']:
        try:
            partial = request.method == 'PATCH'
            serializer = OutfitSerializer(outfit, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated outfit {outfit_id} for user {request.user.id}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating outfit {outfit_id} for user {request.user.id}: {str(e)}")
            return Response({'error': 'Update failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            with transaction.atomic():
                # Delete associated file first (outside transaction for performance)
                if outfit.image:
                    try:
                        outfit.image.delete(save=False)
                        logger.info(f"Deleted image file for outfit {outfit_id}")
                    except Exception as e:
                        logger.warning(f"Could not delete image file for outfit {outfit_id}: {e}")
                
                # Delete the database record
                outfit_name = outfit.name
                outfit.delete()
                logger.info(f"Deleted outfit '{outfit_name}' (ID: {outfit_id}) for user {request.user.id}")
                
                return Response({'message': 'Outfit deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
                
        except Exception as e:
            logger.error(f"Error deleting outfit {outfit_id} for user {request.user.id}: {str(e)}")
            return Response({'error': 'Delete failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_outfit(request, outfit_id):
    try:
        outfit = Outfit.objects.get(id=outfit_id, user=request.user)
        outfit.liked = not outfit.liked
        outfit.save(update_fields=['liked'])  # Only update the liked field for better performance
        
        serializer = OutfitSerializer(outfit)
        logger.info(f"Toggled like for outfit {outfit_id} to {outfit.liked} for user {request.user.id}")
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Outfit.DoesNotExist:
        return Response({'error': 'Outfit not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error toggling like for outfit {outfit_id} for user {request.user.id}: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)