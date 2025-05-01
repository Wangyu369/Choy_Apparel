from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, CartViewSet

router = DefaultRouter()
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'', OrderViewSet, basename='order')


urlpatterns = [
    path('', include(router.urls)),
]
