
from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from orders.models import CartItem
from orders.serializers import CartItemSerializer
from django.db import transaction

from django.contrib.auth import get_user_model
from .serializers import (
    CustomTokenObtainPairSerializer, 
    UserRegistrationSerializer,
    UserSerializer,
    AddressSerializer
)
from .models import Address
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        logger.info(f"Login attempt with email: {request.data.get('email', 'email not provided')}")
        guest_cart = request.data.get('guest_cart', [])
        try:
            response = super().post(request, *args, **kwargs)
            # If login successful and guest_cart is provided, merge it
            if response.status_code == 200 and guest_cart:
                user = User.objects.get(email=request.data.get('email'))
                merge_guest_cart_to_user(user, guest_cart)
                # Return merged cart in response
                cart_items = CartItem.objects.filter(user=user)
                cart_data = CartItemSerializer(cart_items, many=True).data
                # Attach cart to response data
                if isinstance(response.data, dict):
                    # Rename 'token' to 'access' for frontend compatibility
                    if 'token' in response.data:
                        response.data['access'] = response.data.pop('token')
                    response.data['cart'] = cart_data
            logger.info(f"Login successful for email: {request.data.get('email')}")
            return response
        except Exception as e:
            logger.error(f"Login failed for email: {request.data.get('email')} - Error: {str(e)}")
            raise


def merge_guest_cart_to_user(user, guest_cart_items):
    """
    Merge guest cart items (list of dicts) into user's persistent cart.
    Each item should have 'product' (id or dict with id) and 'quantity'.
    """
    for item in guest_cart_items:
        product_id = item.get('product')
        if isinstance(product_id, dict):
            product_id = product_id.get('id')
        quantity = item.get('quantity', 1)
        if not product_id:
            continue
        cart_item, created = CartItem.objects.get_or_create(user=user, product_id=product_id)
        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        cart_item.save()


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        logger.info(f"Registration attempt with data: {request.data}")
        guest_cart = request.data.get('guest_cart', [])
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Registration validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = serializer.save()
            logger.info(f"User created successfully: {user.email}")
            # Merge guest cart into new user's cart
            if guest_cart:
                merge_guest_cart_to_user(user, guest_cart)
            # Generate JWT token
            token_serializer = CustomTokenObtainPairSerializer()
            token_data = token_serializer.validate({
                'email': request.data['email'],
                'password': request.data['password']
            })
            response_data = {
                'token': token_data['access'],
                'refresh': token_data['refresh'],
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'name': user.name,
                },
                'cart': CartItemSerializer(CartItem.objects.filter(user=user), many=True).data
            }
            logger.info(f"Registration complete for: {user.email}")
            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Registration failed with error: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_object(self):
        return self.request.user


from rest_framework.views import APIView

class LogoutView(APIView):
    permission_classes = (AllowAny,)
    def post(self, request, *args, **kwargs):
        # Clear guest cart from session
        if hasattr(request, 'session'):
            request.session['cart'] = []
            request.session.modified = True
        # Clear user cart items from DB if authenticated
        if request.user and request.user.is_authenticated:
            from orders.models import CartItem
            CartItem.objects.filter(user=request.user).delete()
        return Response({'detail': 'Logged out and cart cleared.'}, status=status.HTTP_200_OK)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # If this address is set as default, unset any other default addresses
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).update(is_default=False)
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        # If this address is set as default, unset any other default addresses
        if serializer.validated_data.get('is_default'):
            Address.objects.filter(user=self.request.user, is_default=True).exclude(pk=serializer.instance.pk).update(is_default=False)
        serializer.save()