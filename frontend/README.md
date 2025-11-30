# OnlyFans-Like Platform - Comprehensive Documentation

A complete subscription-based content sharing platform built with **NestJS backend** and **Angular 18 frontend**, featuring authentication, role-based access control, photo upload/sharing, subscription management, and Stripe payment integration.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Backend Documentation](#backend-documentation)
- [Frontend Documentation](#frontend-documentation)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [Deployment Guide](#deployment-guide)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)

## 🚀 Project Overview

This platform enables content creators to share premium photos with subscribers through a secure, subscription-based model. Users can register as either creators or subscribers, with creators able to upload and monetize their content, while subscribers can discover and access premium content through paid subscriptions.

### Key Features

- **User Authentication**: JWT-based authentication with role management
- **Content Management**: Photo upload with premium/public visibility controls
- **Subscription System**: Stripe-powered subscription payments
- **Role-Based Access**: Different interfaces and permissions for creators vs subscribers
- **Security**: Comprehensive security measures including rate limiting, CORS, and input validation
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## 🏗 Architecture

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│                 │ ◄────────────► │                 │
│  Angular 18     │                │   NestJS API    │
│  Frontend       │                │   Backend       │
│                 │                │                 │
└─────────────────┘                └─────────────────┘
        │                                   │
        │                                   │
        ▼                                   ▼
┌─────────────────┐                ┌─────────────────┐
│   Tailwind CSS  │                │   PostgreSQL    │
│   Stripe JS     │                │   Database      │
└─────────────────┘                └─────────────────┘
                                           │
                                           ▼
                                   ┌─────────────────┐
                                   │   Stripe API    │
                                   │   Payments      │
                                   └─────────────────┘
```

## 💻 Technology Stack

### Backend (NestJS)

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Security**: Helmet, bcrypt, rate limiting
- **Payments**: Stripe API integration
- **File Upload**: Multer for photo uploads
- **Documentation**: Swagger/OpenAPI

### Frontend (Angular)

- **Framework**: Angular 18 with standalone components
- **UI Library**: Tailwind CSS with custom components
- **HTTP Client**: Angular HttpClient with interceptors
- **Authentication**: @auth0/angular-jwt
- **Routing**: Angular Router with guards
- **Forms**: Reactive Forms with validation

## 🏁 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- **Stripe Account** (for payments)

### Environment Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd onlyfans-platform
   ```

2. **Backend setup**:

   ```bash
   cd backend
   npm install

   # Configure environment variables
   cp .env.example .env
   # Edit .env with your database and Stripe credentials

   # Start the backend
   npm run start:dev
   ```

3. **Frontend setup**:

   ```bash
   cd frontend
   npm install

   # Start the frontend
   npm start
   ```

4. **Access the application**:
   - Frontend: `http://localhost:4200`
   - Backend API: `http://localhost:3000`
   - API Documentation: `http://localhost:3000/api/docs`

## 🔧 Backend Documentation

### Project Structure

```
backend/
├── src/
│   ├── app.module.ts          # Main application module
│   ├── main.ts                # Application bootstrap
│   ├── auth/                  # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── dto/
│   ├── users/                 # User management
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── entities/
│   ├── photos/                # Photo management
│   │   ├── photos.controller.ts
│   │   ├── photos.service.ts
│   │   └── entities/
│   ├── subscriptions/         # Subscription management
│   │   ├── subscriptions.controller.ts
│   │   ├── subscriptions.service.ts
│   │   └── entities/
│   └── payments/              # Payment processing
│       ├── payments.controller.ts
│       ├── payments.service.ts
│       └── stripe.webhook.controller.ts
├── uploads/                   # Photo storage directory
├── .env                       # Environment variables
└── package.json
```

### Core Modules

#### Authentication Module

- **JWT Strategy**: Validates JWT tokens and extracts user information
- **Auth Guards**: Protects routes requiring authentication
- **Role Guards**: Implements role-based access control
- **Password Hashing**: Uses bcrypt for secure password storage

#### Photo Management

- **File Upload**: Secure file upload with validation
- **Access Control**: Premium content restrictions based on subscriptions
- **Storage**: Local file storage with configurable path

#### Payment Integration

- **Stripe Checkout**: Creates secure payment sessions
- **Webhook Handling**: Processes payment confirmations
- **Subscription Management**: Links payments to user subscriptions

### Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/onlyfans_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application Settings
PORT=3000
FRONTEND_URL=http://localhost:4200
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    url VARCHAR NOT NULL,
    description TEXT,
    creator_id INTEGER REFERENCES users(id),
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER REFERENCES users(id),
    creator_id INTEGER REFERENCES users(id),
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    stripe_subscription_id VARCHAR
);
```

## 🎨 Frontend Documentation

### Project Structure

```
frontend/src/app/
├── app.config.ts              # Application configuration
├── app.routes.ts              # Routing configuration
├── app.ts                     # Root component
├── core/                      # Core functionality
│   ├── guards/
│   │   └── auth.guard.ts      # Route protection
│   ├── interceptors/
│   │   └── auth.interceptor.ts # HTTP interceptor
│   ├── models/
│   │   └── index.ts           # TypeScript interfaces
│   └── services/
│       ├── auth.service.ts    # Authentication logic
│       ├── photo.service.ts   # Photo management
│       └── payment.service.ts # Payment processing
├── features/                  # Feature modules
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── upload/
│   └── subscriptions/
└── styles.scss               # Global styles
```

### Key Components

#### Authentication Components

- **LoginComponent**: Email/password authentication with form validation
- **RegisterComponent**: User registration with creator option
- **AuthGuard**: Protects authenticated routes
- **CreatorGuard**: Restricts creator-only features

#### Dashboard Components

- **DashboardComponent**: Role-based dashboard with different views
- **UploadComponent**: Photo upload with premium content marking
- **SubscriptionsComponent**: Creator discovery and subscription management

#### Services

- **AuthService**: JWT token management and user authentication
- **PhotoService**: Photo upload and retrieval with access control
- **PaymentService**: Stripe payment integration for subscriptions

### Component Communication

```typescript
// Service injection and usage pattern
@Component({...})
export class ExampleComponent {
  constructor(
    private authService: AuthService,
    private photoService: PhotoService
  ) {}

  async loadUserData() {
    const user = this.authService.getCurrentUser();
    const photos = await this.photoService.getPhotos().toPromise();
  }
}
```

## 📡 API Reference

### Authentication Endpoints

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "isCreator": false
}

Response: {
  "access_token": "jwt-token",
  "user": { "id": 1, "email": "user@example.com", "isCreator": false }
}
```

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Photo Management

```http
POST /photos/upload
Authorization: Bearer {jwt-token}
Content-Type: multipart/form-data

file: [image-file]
description: "Photo description"
isPremium: true
```

```http
GET /photos/list
Authorization: Bearer {jwt-token}

Response: [
  {
    "id": 1,
    "url": "/uploads/photo.jpg",
    "description": "Description",
    "creator": { "id": 2, "email": "creator@example.com" },
    "isPremium": true
  }
]
```

### Payment Integration

```http
POST /payments/create-checkout-session
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "creatorId": 2
}

Response: {
  "sessionId": "cs_stripe_session_id"
}
```

## 🔒 Security Features

### Backend Security

- **Helmet**: Security headers protection
- **CORS**: Cross-origin request security
- **Rate Limiting**: API endpoint protection
- **Input Validation**: DTO validation with class-validator
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Token expiration and validation

### Frontend Security

- **Route Guards**: Authentication and authorization protection
- **HTTP Interceptors**: Automatic token attachment
- **XSS Protection**: Angular's built-in sanitization
- **CSRF Protection**: Implemented through Angular HTTP client

### Data Protection

- **File Upload Validation**: Type and size restrictions
- **Access Control**: Premium content protection
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment Guide

### Backend Deployment

1. **Environment Setup**:

   ```bash
   # Production environment variables
   NODE_ENV=production
   DATABASE_URL=production-database-url
   JWT_SECRET=production-jwt-secret
   STRIPE_SECRET_KEY=live-stripe-key
   ```

2. **Build and Deploy**:
   ```bash
   npm run build
   npm run start:prod
   ```

### Frontend Deployment

1. **Build for Production**:

   ```bash
   npm run build
   ```

2. **Deploy to Web Server**:
   - Upload `dist/` folder contents
   - Configure server for SPA routing (serve `index.html` for all routes)
   - Update API endpoints for production environment

### Database Migration

```bash
# Run database migrations
npm run migration:run

# Generate new migration
npm run migration:generate -- -n MigrationName
```

## 👨‍💻 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Configured for consistent code formatting
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages

### Testing Strategy

- **Unit Tests**: Jest for backend, Vitest for frontend
- **E2E Tests**: Cypress for full application testing
- **API Testing**: Supertest for backend endpoint testing

### Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create pull request for code review
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues

```bash
# Database connection errors
ERROR: Check DATABASE_URL in .env file
SOLUTION: Verify PostgreSQL is running and credentials are correct

# JWT token errors
ERROR: Invalid token or expired
SOLUTION: Check JWT_SECRET configuration and token expiration settings

# Stripe webhook errors
ERROR: Invalid webhook signature
SOLUTION: Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
```

#### Frontend Issues

```bash
# Build errors
ERROR: TypeScript compilation errors
SOLUTION: Check import paths and type definitions

# Authentication errors
ERROR: 401 Unauthorized
SOLUTION: Verify JWT token is being sent in Authorization header

# CORS errors
ERROR: Cross-origin request blocked
SOLUTION: Check backend CORS configuration for frontend URL
```

### Development Tools

```bash
# Backend development
npm run start:dev        # Start with hot reload
npm run start:debug      # Start with debugging
npm run lint            # Run ESLint
npm run test            # Run unit tests

# Frontend development
ng serve                # Development server
ng build                # Production build
ng test                 # Unit tests
ng lint                # ESLint check
```

### Performance Optimization

- **Backend**: Enable gzip compression, implement caching
- **Frontend**: Lazy loading, OnPush change detection
- **Database**: Index optimization, query performance
- **Images**: Implement image optimization and CDN

## 📞 Support

For technical support or questions:

- Create an issue in the repository
- Check existing documentation and troubleshooting guides
- Review API documentation at `/api/docs`

---

**Last Updated**: November 30, 2025
**Version**: 1.0.0
