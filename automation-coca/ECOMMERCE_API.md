# 🛍️ E-Commerce API Documentation

**Status**: ✅ Production Ready  
**Version**: 1.0  
**Last Updated**: 2026-10-07  

---

## Overview

Complete e-commerce REST API for K-Beauty CDE platform including:
- 🛍️ Product catalog with advanced search
- 🛒 Shopping cart with coupons
- 👤 User management and authentication
- 📦 Order management
- ⭐ Ratings and reviews

---

## 📦 Products API

### GET `/api/products`
List all products with filtering, sorting, and pagination.

**Query Parameters:**
- `category` - Filter by category
- `search` - Search by name, description, or tags
- `sort` - Sort by: `price-asc`, `price-desc`, `rating`, `newest`
- `limit` - Items per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Example:**
```bash
curl "https://kbeautycde.herokuapp.com/api/products?category=BB%20Creams&sort=rating&limit=10"
```

**Response:**
```json
{
  "products": [
    {
      "id": "kr-bb-001",
      "name": "BB Cream Coreano Premium",
      "category": "BB Creams",
      "price": 25.99,
      "currency": "USD",
      "stock": 50,
      "rating": 4.8,
      "reviews": 124,
      "description": "BB cream con SPF 50+, cobertura total",
      "tags": ["popular", "bestseller", "new"]
    }
  ],
  "total": 42,
  "offset": 0,
  "limit": 10,
  "hasMore": true
}
```

### GET `/api/products/:id`
Get detailed product information with related products.

```bash
curl https://kbeautycde.herokuapp.com/api/products/kr-bb-001
```

**Response:**
```json
{
  "product": { /* detailed product */ },
  "related": [ /* 4 related products */ ],
  "inStock": true
}
```

### GET `/api/products/featured/trending`
Get featured and trending products.

```bash
curl https://kbeautycde.herokuapp.com/api/products/featured/trending
```

### GET `/api/products/categories/list`
List all product categories with counts.

```bash
curl https://kbeautycde.herokuapp.com/api/products/categories/list
```

### POST `/api/products/search`
Advanced search with filters.

**Request Body:**
```json
{
  "query": "BB cream",
  "filters": {
    "priceMin": 10,
    "priceMax": 50,
    "minRating": 4.0,
    "inStock": true
  },
  "sort": "relevance"
}
```

### GET `/api/products/recommendations/for-you`
Personalized product recommendations.

```bash
curl https://kbeautycde.herokuapp.com/api/products/recommendations/for-you
```

---

## 🛒 Shopping Cart API

### GET `/api/cart`
Get current shopping cart.

```bash
curl https://kbeautycde.herokuapp.com/api/cart \
  -H "X-Cart-ID: cart-123..."
```

**Response:**
```json
{
  "id": "cart-123...",
  "items": [
    {
      "productId": "kr-bb-001",
      "quantity": 2,
      "variant": "natural"
    }
  ],
  "totals": {
    "subtotal": 51.98,
    "tax": 5.20,
    "shipping": 10.00,
    "discount": 5.18,
    "total": 61.00
  },
  "coupon": null
}
```

### POST `/api/cart/add`
Add item to cart.

**Request Body:**
```json
{
  "productId": "kr-bb-001",
  "quantity": 2,
  "variant": "natural"
}
```

### PUT `/api/cart/update/:productId`
Update item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE `/api/cart/remove/:productId`
Remove item from cart.

```bash
curl -X DELETE https://kbeautycde.herokuapp.com/api/cart/remove/kr-bb-001
```

### POST `/api/cart/coupon`
Apply coupon code.

**Request Body:**
```json
{
  "code": "WELCOME10"
}
```

**Available Coupons:**
- `WELCOME10` - 10% discount
- `SAVE5` - $5 fixed discount
- `SHIPPING` - Free shipping

### POST `/api/cart/shipping`
Calculate shipping cost.

**Request Body:**
```json
{
  "zipCode": "28001",
  "country": "AR"
}
```

### DELETE `/api/cart/clear`
Clear entire cart.

```bash
curl -X DELETE https://kbeautycde.herokuapp.com/api/cart/clear
```

---

## 👤 Users API

### POST `/api/users/register`
Register new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "Juan García",
  "phone": "+5491234567890"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-123...",
    "email": "user@example.com",
    "name": "Juan García"
  },
  "token": "token_abc123...",
  "message": "Usuario registrado exitosamente"
}
```

### POST `/api/users/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

### GET `/api/users/me`
Get current user profile (requires authentication).

```bash
curl https://kbeautycde.herokuapp.com/api/users/me \
  -H "Authorization: Bearer token_abc123..."
```

### PUT `/api/users/profile`
Update user profile.

**Request Body:**
```json
{
  "name": "Juan García Updated",
  "phone": "+5491234567891",
  "bio": "Amante de skincare coreano"
}
```

### POST `/api/users/address`
Add shipping address.

**Request Body:**
```json
{
  "street": "Calle Principal 123",
  "city": "Santiago del Estero",
  "state": "Santiago del Estero",
  "zipCode": "4200",
  "country": "AR",
  "isDefault": true
}
```

### GET `/api/users/orders`
Get order history.

```bash
curl https://kbeautycde.herokuapp.com/api/users/orders \
  -H "Authorization: Bearer token_abc123..."
```

### GET `/api/users/wishlist`
Get wishlist.

```bash
curl https://kbeautycde.herokuapp.com/api/users/wishlist \
  -H "Authorization: Bearer token_abc123..."
```

### POST `/api/users/wishlist`
Add product to wishlist.

**Request Body:**
```json
{
  "productId": "kr-bb-001"
}
```

### POST `/api/users/logout`
Logout current user.

```bash
curl -X POST https://kbeautycde.herokuapp.com/api/users/logout \
  -H "Authorization: Bearer token_abc123..."
```

---

## 🔐 Authentication

### Token-based Authentication
All protected endpoints require a Bearer token in the Authorization header:

```bash
curl https://kbeautycde.herokuapp.com/api/users/me \
  -H "Authorization: Bearer token_abc123..."
```

### Token Expiration
- Tokens expire after 30 days
- Re-login to get a new token

---

## 💳 Error Responses

All errors follow this format:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `409` - Conflict (e.g., email already registered)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## 📊 Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Checkout**: 10 requests per minute
- **Auth**: 5 attempts per 15 minutes

Rate limit info is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

---

## 🔄 Cart Persistence

Carts are identified by `X-Cart-ID` header and persist for 30 days. If no header is provided, a new cart ID is created and returned in the response.

```bash
curl https://kbeautycde.herokuapp.com/api/cart \
  -H "X-Cart-ID: cart-existing-id"
```

---

## 📈 Pricing & Currency

All prices are in USD. Prices are calculated automatically based on:
- Product base price
- Quantity
- Tax (10%)
- Shipping (varies by location)
- Coupons/discounts

---

## 🚀 Performance Tips

1. **Use Caching Headers**: Responses include cache control headers
2. **Paginate Large Results**: Use `limit` and `offset` parameters
3. **Search Smart**: Use specific search terms for better results
4. **Reuse Cart ID**: Keep the same cart across requests

---

## 📚 Examples

### Complete Purchase Flow

```bash
# 1. Register user
curl -X POST https://kbeautycde.herokuapp.com/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"Juan","phone":"+54..."}'

# 2. Add product to cart
curl -X POST https://kbeautycde.herokuapp.com/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"productId":"kr-bb-001","quantity":2}'

# 3. Apply coupon
curl -X POST https://kbeautycde.herokuapp.com/api/cart/coupon \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10"}'

# 4. Calculate shipping
curl -X POST https://kbeautycde.herokuapp.com/api/cart/shipping \
  -H "Content-Type: application/json" \
  -d '{"zipCode":"4200","country":"AR"}'

# 5. Get final cart
curl https://kbeautycde.herokuapp.com/api/cart

# 6. Proceed to checkout
# (Checkout endpoint implements payment processing)
```

---

## 🔗 Related Documentation

- [ADVANCED_FEATURES.md](./ADVANCED_FEATURES.md) - System features
- [ADVANCED_QUICK_START.md](../ADVANCED_QUICK_START.md) - Quick start guide
- [/api/v2/docs](https://kbeautycde.herokuapp.com/api/v2/docs) - Live API reference

---

**Status**: ✅ Production Ready  
**Generated**: 2026-10-07  
**By**: Claude Haiku 4.5
