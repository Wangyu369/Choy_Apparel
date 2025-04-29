
# E-commerce Backend

This is a Django REST API backend for an e-commerce web application.

## Setup Instructions

1. Create a virtual environment:
```
python -m venv venv
```

2. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Configure PostgreSQL:
   - Create a PostgreSQL database for the project
   - Set the environment variables for your database connection:
     ```
     POSTGRES_DB=ecommerce
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=postgres
     POSTGRES_HOST=localhost
     POSTGRES_PORT=5432
     ```

5. Run migrations:
```
python manage.py migrate
```

6. Create media directory and add a placeholder image:
```
mkdir -p media/products
cp path/to/placeholder.jpg media/products/placeholder.jpg
```

7. Load initial data:
```
python initial_data.py
```

8. Create a superuser (if not using initial_data.py):
```
python manage.py createsuperuser
```

9. Run the development server:
```
python manage.py runserver
```

## API Endpoints

### Authentication
- POST `/api/auth/register/` - Register a new user
- POST `/api/auth/login/` - Log in (get JWT token)
- POST `/api/auth/refresh/` - Refresh JWT token
- GET `/api/auth/profile/` - Get user profile
- CRUD `/api/auth/addresses/` - Manage user addresses

### Products
- GET `/api/products/` - List all products
- GET `/api/products/<id>/` - Get product details
- GET `/api/products/?category=<category_code>` - Get products by category
- GET `/api/products/bestsellers/` - Get best seller products
- GET `/api/products/categories/` - List all categories

### Orders
- GET `/api/orders/` - List user orders
- GET `/api/orders/<id>/` - Get order details
- POST `/api/orders/` - Create a new order

## Admin Interface

Access the admin interface at `/admin/` to manage products, orders, and users.

Default admin credentials (if using initial_data.py):
- Email: admin@example.com
- Password: adminpassword
