
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, product_by_category, bestsellers

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'', ProductViewSet)

urlpatterns = [
    path('bestsellers/', bestsellers, name='bestsellers'),
    path('', include(router.urls)),
]
