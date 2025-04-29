
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, Address
from django.db import transaction, connection

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    
    def get_deleted_objects(self, objs, request):
        """
        Hook to customize the deletion process to handle related objects properly.
        """
        deleted_objects, model_count, perms_needed, protected = super().get_deleted_objects(objs, request)
        return deleted_objects, model_count, set(), protected  # Empty set for perms_needed allows deletion
    
    def has_delete_permission(self, request, obj=None):
        """Always allow deletion for superusers."""
        if request.user.is_superuser:
            return True
        return super().has_delete_permission(request, obj)
    
    def table_exists(self, table_name):
        """Check if a table exists in the database."""
        with connection.cursor() as cursor:
            tables = connection.introspection.table_names(cursor)
            return table_name in tables
    
    def delete_model(self, request, obj):
        """
        Custom delete method to ensure all related objects are properly deleted.
        """
        try:
            with transaction.atomic():
                # Explicitly delete related address objects
                Address.objects.filter(user=obj).delete()
                
                # Only try to handle orders if the table exists
                # This prevents errors when the orders_order table doesn't exist yet
                if self.table_exists('orders_order'):
                    # If you want to handle orders in the future, you can add that logic here
                    # For now, we're relying on CASCADE deletion through the foreign key
                    pass
                
                # Delete the user once related objects are handled
                obj.delete()
                
                self.message_user(request, f"User {obj.email} has been successfully deleted.")
        except Exception as e:
            self.message_user(request, f"Error deleting user: {str(e)}", level='error')
    
    def delete_queryset(self, request, queryset):
        """
        Custom bulk delete method to ensure all related objects are properly deleted.
        """
        try:
            with transaction.atomic():
                for obj in queryset:
                    self.delete_model(request, obj)
        except Exception as e:
            self.message_user(request, f"Error deleting users: {str(e)}", level='error')

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'first_name', 'last_name', 'city', 'state', 'is_default')
    list_filter = ('state', 'is_default')
    search_fields = ('user__email', 'first_name', 'last_name', 'city', 'state')