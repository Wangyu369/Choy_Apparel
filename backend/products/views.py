
from rest_framework import viewsets, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, ProductListSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer

        
    def get_queryset(self):
        queryset = Product.objects.all()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__code=category)
        return queryset

@api_view(['GET'])
@permission_classes([AllowAny])
def product_by_category(request):
    category_code = request.query_params.get('category')
    if not category_code:
        return Response({"error": "Category parameter is required"}, status=400)
    
    products = Product.objects.filter(category__code=category_code)
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def bestsellers(request):
    products = Product.objects.filter(is_best_seller=True)
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)
