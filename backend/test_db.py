
#!/usr/bin/env python
"""Test script to verify database connection"""
import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_project.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

def test_database():
    """Test database connection and basic model access"""
    print("Testing database connection...")
    
    # Test connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print(f"Database connection test: {result}")
    except Exception as e:
        print(f"Database connection error: {e}")
        return False
    
    # Test model access
    try:
        user_count = User.objects.count()
        print(f"User count in database: {user_count}")
    except Exception as e:
        print(f"Model access error: {e}")
        return False
        
    print("Database test completed successfully")
    return True

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)