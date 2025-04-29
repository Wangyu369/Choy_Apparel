
#!/usr/bin/env python
import os
import django
import uuid

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Category, Product

User = get_user_model()

def create_initial_data():
    print("Creating initial data...")
    
    # Create admin user
    if not User.objects.filter(email='admin@example.com').exists():
        User.objects.create_superuser(
            email='admin@example.com',
            password='adminpassword',
            first_name='Admin',
            last_name='User'
        )
        print("Admin user created.")
    
    # Create categories
    categories = {
        'men': 'Men',
        'women': 'Women',
        'essentials': 'Essentials'
    }
    
    category_objects = {}
    for code, name in categories.items():
        cat, created = Category.objects.get_or_create(
            code=code,
            defaults={
                'name': name,
                'slug': code
            }
        )
        category_objects[code] = cat
        if created:
            print(f"Category '{name}' created.")
    
    # Sample products for Men category
    men_products = [
        {
            'name': 'White BRB in the Hood',
            'price': 89.90,
            'description': 'A comfortable white hoodie with BRB print, perfect for casual outings.',
            'is_best_seller': True,
        },
        {
            'name': 'Brother Jacket Camo',
            'price': 99.90,
            'description': 'Stylish camo jacket with unique "Brother" design, great for layering.',
            'is_best_seller': True,
        },
        {
            'name': 'Relaxing Shorts',
            'price': 49.90,
            'description': 'Comfortable black shorts perfect for relaxation or light activities.',
            'is_best_seller': True,
        },
        {
            'name': 'Last Supper Sweat Shirt',
            'price': 79.90,
            'description': 'Gray sweatshirt featuring an artistic "Last Supper" print.',
            'is_best_seller': True,
        },
    ]
    
    # Sample products for Women category
    women_products = [
        {
            'name': 'Summer Dress',
            'price': 79.90,
            'description': 'Lightweight floral dress perfect for summer days.',
            'is_best_seller': False,
        },
        {
            'name': 'Classic Blouse',
            'price': 59.90,
            'description': 'Elegant white blouse suitable for both casual and formal occasions.',
            'is_best_seller': False,
        },
        {
            'name': 'Denim Jacket',
            'price': 89.90,
            'description': 'Classic denim jacket that goes with any outfit.',
            'is_best_seller': False,
        },
    ]
    
    # Sample products for Essentials category
    essentials_products = [
        {
            'name': 'Cap in Steel Blue',
            'price': 34.90,
            'description': 'Classic steel blue cap with a modern twist, adjustable fit.',
            'is_best_seller': True,
        },
        {
            'name': 'Sleeper',
            'price': 45.90,
            'description': 'Comfortable checkered slippers for everyday use.',
            'is_best_seller': True,
        },
        {
            'name': 'Cloud Bag',
            'price': 69.90,
            'description': 'Sleek black bag with a "cloud" design, spacious and practical.',
            'is_best_seller': True,
        },
    ]
    
    # Create products for each category
    create_products(men_products, category_objects['men'])
    create_products(women_products, category_objects['women'])
    create_products(essentials_products, category_objects['essentials'])
    
    print("Initial data creation completed.")

def create_products(products_data, category):
    for product_data in products_data:
        # Check if product already exists by name
        if not Product.objects.filter(name=product_data['name']).exists():
            # Create a product with a default image placeholder
            product = Product(
                name=product_data['name'],
                description=product_data['description'],
                price=product_data['price'],
                category=category,
                is_best_seller=product_data['is_best_seller'],
                stock=100,
            )
            
            # Set image to empty string and save
            # In production, you would want to use a real image
            product.image = 'products/placeholder.jpg'
            product.save()
            
            print(f"Product '{product_data['name']}' created.")

if __name__ == '__main__':
    create_initial_data()
