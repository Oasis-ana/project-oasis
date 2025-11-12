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
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

# Add logging for debugging upload issues
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    logger.info(f"Registration attempt for username: {request.data.get('username', 'unknown')}")
    
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        UserProfile.objects.get_or_create(user=user)  # Ensure profile created
        token, _ = Token.objects.get_or_create(user=user)
        
        logger.info(f"User registered successfully: {user.username}")
        
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
    
    logger.error(f"Registration failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


#@api_view(['POST'])
#@permission_classes([AllowAny])
#def login(request):
    #logger.info(f"Login attempt for username: {request.data.get('username', 'unknown')}")
    
    #serializer = UserLoginSerializer(data=request.data)
    #if serializer.is_valid():
        #user = serializer.validated_data['user']
        #token, _ = Token.objects.get_or_create(user=user)
        
       # logger.info(f"User logged in successfully: {user.username}")
        
      #  return Response({
          #  'user': {
           #     'id': user.id,
            #    'username': user.username,
             #   'email': user.email,
              #  'first_name': user.first_name,
               # 'last_name': user.last_name,
           # },
            #'token': token.key,
            #'message': 'Login successful'
        #}, status=status.HTTP_200_OK)
    
    #logger.error(f"Login failed: {serializer.errors}")
  
#return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@csrf_exempt  
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    print(" LOGIN VIEW HIT")
    print(" RAW request.data:", request.data)

    serializer = UserLoginSerializer(data=request.data)
    print(" Serializer created")

    if serializer.is_valid():
        print(" Serializer VALID")

        user = serializer.validated_data['user']
        print("👤 Authenticated user:", user.username)

        try:
            print(" Creating or getting token…")
            token, _ = Token.objects.get_or_create(user=user)
            print(" Token created:", token.key)
        except Exception as e:
            print(" Token error:", str(e))

        print("📤 Sending response…")
        return Response({
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "token": token.key,
            "message": "Login successful"
        })

    print("Serializer INVALID:", serializer.errors)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
        logger.info(f"User logged out: {request.user.username}")
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Logout error for {request.user.username}: {str(e)}")
        return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Profile fetch error for {request.user.username}: {str(e)}")
        return Response({'error': 'Error fetching profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_profile(request):
    logger.info(f"Profile update attempt for user: {request.user.username}")
    
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    data = request.data

    try:
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

        logger.info(f"Profile updated successfully for user: {user.username}")

        serializer = UserProfileSerializer(profile)
        response_data = serializer.data
        if token:
            response_data['new_token'] = token.key
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Profile update error for {request.user.username}: {str(e)}")
        return Response({'error': 'Error updating profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    logger.info(f"Avatar upload attempt for user: {request.user.username}")
    
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
        logger.error("AWS S3 not properly configured for avatar upload")
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
        
        profile, _ = UserProfile.objects.get_or_create(user=request.user)

        # Delete old avatar file if exists
        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = resized_file
        profile.save()

        logger.info(f"Avatar uploaded successfully for user: {request.user.username}")

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Avatar upload failed for {request.user.username}: {str(e)}")
        return Response({'error': f'Image processing failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def clothing_items(request):
    if request.method == 'GET':
        try:
            items = ClothingItem.objects.filter(user=request.user)
            serializer = ClothingItemSerializer(items, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching clothing items for {request.user.username}: {str(e)}")
            return Response({'error': 'Error fetching items'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        logger.info(f"Clothing item creation attempt for user: {request.user.username}")
        
        try:
            serializer = ClothingItemSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                clothing_item = serializer.save()
                logger.info(f"Clothing item created successfully: {clothing_item.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            logger.error(f"Clothing item validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Clothing item creation error for {request.user.username}: {str(e)}")
            return Response({'error': 'Error creating item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def clothing_item_detail(request, item_id):
    try:
        item = ClothingItem.objects.get(id=item_id, user=request.user)
    except ClothingItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        try:
            serializer = ClothingItemSerializer(item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching clothing item {item_id}: {str(e)}")
            return Response({'error': 'Error fetching item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method in ['PUT', 'PATCH']:
        logger.info(f"Clothing item update attempt: {item_id}")
        
        try:
            partial = request.method == 'PATCH'
            serializer = ClothingItemSerializer(item, data=request.data, partial=partial)
            if serializer.is_valid():
                updated_item = serializer.save()
                logger.info(f"Clothing item updated successfully: {item_id}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            logger.error(f"Clothing item update validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Clothing item update error {item_id}: {str(e)}")
            return Response({'error': 'Error updating item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            if item.image:
                item.image.delete()
            item.delete()
            logger.info(f"Clothing item deleted successfully: {item_id}")
            return Response({'message': 'Item deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Clothing item deletion error {item_id}: {str(e)}")
            return Response({'error': 'Error deleting item'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def outfits(request):
    if request.method == 'GET':
        try:
            # Start with the base queryset for the user
            user_outfits = Outfit.objects.filter(user=request.user).order_by('-created_at')

            # Check if a 'category' parameter is in the URL
            category_filter = request.query_params.get('category', None)
            if category_filter:
                # If it exists, filter the queryset further
                user_outfits = user_outfits.filter(category=category_filter)
                logger.info(f"Filtering outfits by category: {category_filter}")

            serializer = OutfitSerializer(user_outfits, many=True, context={'request': request})
            logger.info(f"Fetched {len(user_outfits)} outfits for user: {request.user.username}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching outfits for {request.user.username}: {str(e)}")
            return Response({'error': 'Error fetching outfits'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        logger.info(f"Outfit creation attempt for user: {request.user.username}")
        logger.info(f"Request data keys: {list(request.data.keys())}")
        logger.info(f"Request files: {list(request.FILES.keys())}")
        
        try:
            # Add timeout handling and better error responses
            serializer = OutfitSerializer(data=request.data, context={'request': request})
            
            if serializer.is_valid():
                logger.info(f"Outfit validation successful, saving...")
                outfit = serializer.save()
                logger.info(f"Outfit created successfully: {outfit.id} - '{outfit.title}'")
                
                # IMPORTANT: Return the complete outfit data
                response_serializer = OutfitSerializer(outfit, context={'request': request})
                
                return Response({
                    'success': True,
                    'id': outfit.id,
                    'outfit': response_serializer.data,
                    'message': 'Outfit created successfully'
                }, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Outfit validation failed for {request.user.username}: {serializer.errors}")
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Outfit creation exception for {request.user.username}: {str(e)}")
            
            # Still return a proper JSON response even on error
            return Response({
                'success': False,
                'error': f'Server error: {str(e)}',
                'message': 'Failed to create outfit'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def outfit_detail(request, outfit_id):
    try:
        outfit = Outfit.objects.get(id=outfit_id, user=request.user)
    except Outfit.DoesNotExist:
        logger.warning(f"Outfit not found: {outfit_id} for user: {request.user.username}")
        return Response({'error': 'Outfit not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        try:
            serializer = OutfitSerializer(outfit, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching outfit {outfit_id}: {str(e)}")
            return Response({'error': 'Error fetching outfit'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method in ['PUT', 'PATCH']:
        logger.info(f"Outfit update attempt: {outfit_id}")
        
        try:
            partial = request.method == 'PATCH'
            serializer = OutfitSerializer(outfit, data=request.data, partial=partial, context={'request': request})
            
            if serializer.is_valid():
                updated_outfit = serializer.save()
                logger.info(f"Outfit updated successfully: {outfit_id}")
                
                response_serializer = OutfitSerializer(updated_outfit, context={'request': request})
                
                return Response({
                    'success': True,
                    'id': updated_outfit.id,
                    'outfit': response_serializer.data,
                    'message': 'Outfit updated successfully'
                }, status=status.HTTP_200_OK)
            else:
                logger.error(f"Outfit update validation failed: {serializer.errors}")
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Outfit update exception {outfit_id}: {str(e)}")
            return Response({
                'success': False,
                'error': f'Server error: {str(e)}',
                'message': 'Failed to update outfit'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'DELETE':
        try:
            if outfit.image:
                outfit.image.delete()
            outfit.delete()
            logger.info(f"Outfit deleted successfully: {outfit_id}")
            return Response({
                'success': True,
                'message': 'Outfit deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Outfit deletion error {outfit_id}: {str(e)}")
            return Response({
                'success': False,
                'error': 'Error deleting outfit'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_outfit(request, outfit_id):
    logger.info(f"Like toggle attempt for outfit {outfit_id} by user: {request.user.username}")
    
    try:
        outfit = Outfit.objects.get(id=outfit_id, user=request.user)
        outfit.liked = not outfit.liked
        outfit.save()
        
        logger.info(f"Outfit like toggled: {outfit_id} - liked: {outfit.liked}")
        
        serializer = OutfitSerializer(outfit, context={'request': request})
        return Response({
            'success': True,
            'liked': outfit.liked,
            'outfit': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Outfit.DoesNotExist:
        logger.warning(f"Outfit not found for like: {outfit_id}")
        return Response({'error': 'Outfit not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Like toggle error for outfit {outfit_id}: {str(e)}")
        return Response({'error': 'Error updating like status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_check(request):
    """Simple health check endpoint to test connection"""
    # Import timezone here or at the top of the file
    from django.utils import timezone
    return Response({
        'status': 'healthy',
        'user': request.user.username,
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)
