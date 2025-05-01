from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order, CartItem
from .serializers import OrderSerializer, OrderCreateSerializer, CartItemSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status == 'canceled':
            return Response({'detail': 'Order is already canceled.'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = 'canceled'
        order.save()
        return Response({'status': 'canceled'}, status=status.HTTP_200_OK)
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Return the created order using the OrderSerializer for the response
        response_serializer = OrderSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


from rest_framework import mixins, viewsets, permissions
from .models import CartItem
from .serializers import CartItemSerializer

class CartViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartItemSerializer

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        # Explicit list method with logging to debug 404 issue
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"CartViewSet list called by user: {request.user}")
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='add')
    def add(self, request):
        """Add a product to the cart or update quantity if it exists"""
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        if not product_id:
            return Response({'detail': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response({'detail': 'Quantity must be positive'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'detail': 'Quantity must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = CartItem.objects.get_or_create(user=request.user, product_id=product_id)
        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        cart_item.save()
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='remove')
    def remove(self, request):
        """Remove a product from the cart"""
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'detail': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        cart_item = CartItem.objects.filter(user=request.user, product_id=product_id).first()
        if cart_item:
            cart_item.delete()
            return Response({'detail': 'Item removed'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='update-quantity')
    def update_quantity(self, request):
        """Update quantity of a product in the cart"""
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity')
        if not product_id or quantity is None:
            return Response({'detail': 'Product ID and quantity are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            quantity = int(quantity)
            if quantity < 0:
                return Response({'detail': 'Quantity cannot be negative'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'detail': 'Quantity must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        cart_item = CartItem.objects.filter(user=request.user, product_id=product_id).first()
        if not cart_item:
            return Response({'detail': 'Item not found in cart'}, status=status.HTTP_404_NOT_FOUND)
        if quantity == 0:
            cart_item.delete()
            return Response({'detail': 'Item removed'}, status=status.HTTP_200_OK)
        cart_item.quantity = quantity
        cart_item.save()
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='merge')
    def merge(self, request):
        """Merge guest cart items into the user's cart"""
        items = request.data.get('items', [])
        if not isinstance(items, list):
            return Response({'detail': 'Items must be a list'}, status=status.HTTP_400_BAD_REQUEST)
        for item in items:
            product_id = item.get('product', {}).get('id')
            quantity = item.get('quantity', 1)
            if not product_id:
                continue
            cart_item, created = CartItem.objects.get_or_create(user=request.user, product_id=product_id)
            if not created:
                cart_item.quantity += quantity
            else:
                cart_item.quantity = quantity
            cart_item.save()
        cart_items = CartItem.objects.filter(user=request.user)
        serializer = CartItemSerializer(cart_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='clear')
    def clear(self, request):
        """Clear all cart items for the logged-in user"""
        CartItem.objects.filter(user=request.user).delete()
        return Response({'detail': 'Cart cleared'}, status=status.HTTP_200_OK)
