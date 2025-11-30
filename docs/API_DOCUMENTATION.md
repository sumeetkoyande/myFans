# OnlyFans Platform - API Documentation

## 📋 API Overview

This document provides comprehensive API documentation for the OnlyFans-like platform backend. The API is built with NestJS and follows RESTful conventions with JWT authentication.

**Base URL**: `http://localhost:3000` (development) / `https://your-domain.com` (production)

**API Version**: v1.0.0

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <jwt-token>
```

### Token Format

```json
{
  "sub": 1,
  "email": "user@example.com",
  "isCreator": false,
  "iat": 1638360000,
  "exp": 1638446400
}
```

## 🚀 API Endpoints

### Authentication Endpoints

#### Register User

Creates a new user account.

```http
POST /auth/register
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "isCreator": false
}
```

**Response** (201 Created):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "isCreator": false,
    "isActive": true
  }
}
```

**Validation Rules**:

- `email`: Must be a valid email format
- `password`: Minimum 6 characters
- `isCreator`: Boolean (optional, defaults to false)

**Error Responses**:

```json
// 400 Bad Request - Validation Error
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}

// 409 Conflict - Email Already Exists
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

#### Login User

Authenticates a user and returns JWT token.

```http
POST /auth/login
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "isCreator": false,
    "isActive": true
  }
}
```

**Error Responses**:

```json
// 401 Unauthorized - Invalid Credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### User Management Endpoints

#### Get Current User Profile

Returns the authenticated user's profile information.

```http
GET /users/profile
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):

```json
{
  "id": 1,
  "email": "user@example.com",
  "isCreator": false,
  "isActive": true
}
```

#### Update User Profile

Updates the authenticated user's profile.

```http
PUT /users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "isCreator": true
}
```

**Response** (200 OK):

```json
{
  "id": 1,
  "email": "user@example.com",
  "isCreator": true,
  "isActive": true
}
```

#### Get User by ID

Returns public information about a specific user.

```http
GET /users/:id
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):

```json
{
  "id": 2,
  "email": "creator@example.com",
  "isCreator": true
}
```

### Photo Management Endpoints

#### Upload Photo

Uploads a new photo (creators only).

```http
POST /photos/upload
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data**:

- `file`: Image file (JPG, PNG, GIF, max 5MB)
- `description`: Text description (optional)
- `isPremium`: Boolean string ("true" or "false")

**Example using curl**:

```bash
curl -X POST \
  http://localhost:3000/photos/upload \
  -H 'Authorization: Bearer <jwt-token>' \
  -F 'file=@/path/to/image.jpg' \
  -F 'description=My awesome photo' \
  -F 'isPremium=true'
```

**Response** (201 Created):

```json
{
  "id": 1,
  "url": "/uploads/abc123def456.jpg",
  "description": "My awesome photo",
  "creator": {
    "id": 2,
    "email": "creator@example.com"
  },
  "isPremium": true,
  "createdAt": "2023-12-01T10:00:00.000Z"
}
```

**Error Responses**:

```json
// 403 Forbidden - Not a Creator
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 400 Bad Request - Invalid File
{
  "statusCode": 400,
  "message": "Only image files are allowed",
  "error": "Bad Request"
}

// 413 Payload Too Large - File Too Big
{
  "statusCode": 413,
  "message": "File too large",
  "error": "Payload Too Large"
}
```

#### Get Accessible Photos

Returns photos accessible to the authenticated user.

```http
GET /photos/list
Authorization: Bearer <jwt-token>
```

**Query Parameters**:

- `page`: Page number (optional, default: 1)
- `limit`: Items per page (optional, default: 20, max: 100)
- `creatorId`: Filter by creator ID (optional)
- `premium`: Filter by premium status (optional, true/false)

**Example**:

```http
GET /photos/list?page=1&limit=10&premium=false
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": 1,
      "url": "/uploads/abc123def456.jpg",
      "description": "Public photo",
      "creator": {
        "id": 2,
        "email": "creator@example.com"
      },
      "isPremium": false,
      "createdAt": "2023-12-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "url": "/uploads/def456ghi789.jpg",
      "description": "Premium content",
      "creator": {
        "id": 2,
        "email": "creator@example.com"
      },
      "isPremium": true,
      "createdAt": "2023-12-01T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### Get Photo by ID

Returns a specific photo if accessible to the user.

```http
GET /photos/:id
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):

```json
{
  "id": 1,
  "url": "/uploads/abc123def456.jpg",
  "description": "My awesome photo",
  "creator": {
    "id": 2,
    "email": "creator@example.com"
  },
  "isPremium": true,
  "createdAt": "2023-12-01T10:00:00.000Z"
}
```

**Error Responses**:

```json
// 404 Not Found - Photo doesn't exist or no access
{
  "statusCode": 404,
  "message": "Photo not found or access denied",
  "error": "Not Found"
}
```

#### Delete Photo

Deletes a photo (creators can only delete their own photos).

```http
DELETE /photos/:id
Authorization: Bearer <jwt-token>
```

**Response** (204 No Content)

**Error Responses**:

```json
// 403 Forbidden - Not the photo owner
{
  "statusCode": 403,
  "message": "You can only delete your own photos",
  "error": "Forbidden"
}
```

### Subscription Management Endpoints

#### Get User Subscriptions

Returns active subscriptions for the authenticated user.

```http
GET /subscriptions/my-subscriptions
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):

```json
[
  {
    "id": 1,
    "creator": {
      "id": 2,
      "email": "creator@example.com"
    },
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2024-01-01T00:00:00.000Z",
    "status": "active"
  }
]
```

#### Get Creator's Subscribers

Returns subscribers for the authenticated creator.

```http
GET /subscriptions/my-subscribers
Authorization: Bearer <jwt-token>
```

**Response** (200 OK):

```json
[
  {
    "id": 1,
    "subscriber": {
      "id": 3,
      "email": "subscriber@example.com"
    },
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2024-01-01T00:00:00.000Z",
    "status": "active"
  }
]
```

### Payment Endpoints

#### Create Checkout Session

Creates a Stripe checkout session for subscribing to a creator.

```http
POST /payments/create-checkout-session
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "creatorId": 2
}
```

**Response** (200 OK):

```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
}
```

**Error Responses**:

```json
// 400 Bad Request - Already Subscribed
{
  "statusCode": 400,
  "message": "You are already subscribed to this creator",
  "error": "Bad Request"
}

// 404 Not Found - Creator Not Found
{
  "statusCode": 404,
  "message": "Creator not found",
  "error": "Not Found"
}
```

#### Stripe Webhook

Handles Stripe webhook events (called by Stripe, not by clients).

```http
POST /payments/stripe-webhook
Content-Type: application/json
Stripe-Signature: <stripe-signature>
```

This endpoint is called by Stripe when payment events occur and should not be called directly by clients.

## 📊 Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Upload endpoints**: 10 requests per minute per user

**Rate Limit Headers**:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

**Rate Limit Exceeded Response** (429 Too Many Requests):

```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Too Many Requests"
}
```

## 🔍 Error Handling

### Standard Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "path": "/api/endpoint"
}
```

### HTTP Status Codes Used

| Status Code | Description           | Use Cases                             |
| ----------- | --------------------- | ------------------------------------- |
| 200         | OK                    | Successful GET, PUT requests          |
| 201         | Created               | Successful POST requests              |
| 204         | No Content            | Successful DELETE requests            |
| 400         | Bad Request           | Validation errors, malformed requests |
| 401         | Unauthorized          | Invalid or missing authentication     |
| 403         | Forbidden             | Insufficient permissions              |
| 404         | Not Found             | Resource not found                    |
| 409         | Conflict              | Resource already exists               |
| 413         | Payload Too Large     | File upload size exceeded             |
| 429         | Too Many Requests     | Rate limit exceeded                   |
| 500         | Internal Server Error | Server-side errors                    |

### Common Error Scenarios

#### Authentication Errors

```json
// Missing token
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

// Invalid token
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}

// Expired token
{
  "statusCode": 401,
  "message": "Token expired",
  "error": "Unauthorized"
}
```

#### Validation Errors

```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

#### Permission Errors

```json
{
  "statusCode": 403,
  "message": "Only creators can upload photos",
  "error": "Forbidden"
}
```

## 📝 Request/Response Examples

### Complete User Registration Flow

#### 1. Register as Creator

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "securepass123",
    "isCreator": true
  }'
```

#### 2. Upload Photo

```bash
curl -X POST http://localhost:3000/photos/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@photo.jpg" \
  -F "description=My first photo" \
  -F "isPremium=true"
```

### Complete Subscription Flow

#### 1. Register as Subscriber

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "subscriber@example.com",
    "password": "securepass123",
    "isCreator": false
  }'
```

#### 2. Create Checkout Session

```bash
curl -X POST http://localhost:3000/payments/create-checkout-session \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"creatorId": 1}'
```

#### 3. Access Premium Photos

```bash
curl -X GET "http://localhost:3000/photos/list?premium=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🧪 Testing the API

### Using curl

#### Test Authentication

```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","isCreator":true}' \
  | jq -r '.access_token')

# Use token for authenticated requests
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. **Set up environment variables**:

   - `baseUrl`: `http://localhost:3000`
   - `token`: `{{access_token}}`

2. **Create collection with requests**:

   - Add Authorization header: `Bearer {{token}}`
   - Create pre-request script to set token from login response

3. **Test scenarios**:
   - User registration and login
   - Photo upload and access control
   - Subscription creation and validation

### Using Jest (for automated testing)

```javascript
describe("API Integration Tests", () => {
  let app: INestApplication
  let userToken: string
  let creatorToken: string

  beforeAll(async () => {
    // Setup test app
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  describe("/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "test@example.com",
          password: "password123",
          isCreator: false,
        })
        .expect(201)

      expect(response.body).toHaveProperty("access_token")
      expect(response.body.user.email).toBe("test@example.com")
      userToken = response.body.access_token
    })
  })

  describe("/photos/upload", () => {
    it("should upload photo for creator", async () => {
      const response = await request(app.getHttpServer())
        .post("/photos/upload")
        .set("Authorization", `Bearer ${creatorToken}`)
        .attach("file", "test/fixtures/test-image.jpg")
        .field("description", "Test photo")
        .field("isPremium", "true")
        .expect(201)

      expect(response.body).toHaveProperty("url")
      expect(response.body.isPremium).toBe(true)
    })
  })
})
```

## 📋 API Changelog

### Version 1.0.0 (Current)

- Initial API release
- User authentication and registration
- Photo upload and management
- Subscription system with Stripe integration
- Role-based access control

### Planned Features (v1.1.0)

- Photo likes and comments
- Creator earnings dashboard
- Advanced search and filtering
- Content reporting system
- Mobile app API endpoints

---

**Note**: This API is under active development. Breaking changes may occur in pre-1.0 versions. Always check the changelog before upgrading.
