
from rest_framework import serializers
from .models import Order, OrderItem
from products.serializers import ProductListSerializer
from products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_details', 'quantity', 'price')
        extra_kwargs = {
            'product': {'write_only': True}
        }


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = (
            'id', 'total_amount', 'status', 'payment_method',
            'shipping_first_name', 'shipping_last_name', 'shipping_address',
            'shipping_city', 'shipping_state', 'shipping_zip', 'shipping_phone',
            'items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'status', 'created_at', 'updated_at')


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemCreateSerializer(many=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    
    # Shipping address
    shipping_first_name = serializers.CharField(max_length=100)
    shipping_last_name = serializers.CharField(max_length=100)
    shipping_address = serializers.CharField(max_length=255)
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_zip = serializers.CharField(max_length=20)
    shipping_phone = serializers.CharField(max_length=20)
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        
        # Create the order
        order = Order.objects.create(user=user, **validated_data)
        
        # Create order items
        for item_data in items_data:
            product_id = item_data.pop('product_id')
            try:
                product = Product.objects.get(id=product_id)
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    **item_data
                )
                
                # Update product stock
                product.stock -= item_data['quantity']
                product.save()
            except Product.DoesNotExist:
                # Log the error but continue processing other items
                continue
        
        return order
