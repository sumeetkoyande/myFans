# OnlyFans-like Backend (NestJS) - Production Ready

## Overview

This is a production-ready backend for a subscription-based photo-sharing platform, similar to OnlyFans. Built with NestJS, TypeORM, PostgreSQL, and Stripe, it includes comprehensive security features, validation, rate limiting, and proper error handling.

## 🚀 Features

- **🔐 Secure Authentication:** JWT-based with bcrypt hashing and validation
- **👥 Role-Based Access Control:** Creator and user roles with guards
- **📸 Photo Upload:** Secure file uploads with validation (5MB limit, image types only)
- **💳 Stripe Integration:** Payment processing with webhook handling
- **🛡️ Security Features:** Helmet, CORS, rate limiting, input validation
- **📚 API Documentation:** Swagger/OpenAPI documentation
- **🔄 Database Relations:** Proper TypeORM relationships and queries
- **⚡ Performance:** Compression, caching, optimized queries

## 🛠️ Tech Stack

- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL with TypeORM
- **Authentication:** JWT with Passport
- **Payments:** Stripe
- **Security:** Helmet, Throttler, Class Validator
- **Documentation:** Swagger/OpenAPI
- **File Upload:** Multer with security validation

## 📁 Folder Structure

```
backend/
├── src/
│   ├── auth/              # Authentication (JWT, guards, roles, DTOs)
│   ├── users/             # User management
│   ├── photos/            # Photo upload & access control
│   ├── subscriptions/     # Subscription logic
│   ├── payments/          # Stripe integration & webhooks
│   ├── app.module.ts      # Main application module
│   └── main.ts            # Bootstrap with security middleware
├── uploads/               # Local file storage (use S3 in production)
├── .env.example          # Environment variables template
└── package.json
  README.md
```

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```
2. **Configure PostgreSQL:**
   - Update DB credentials in `src/app.module.ts` or use environment variables.
   - Create a database named `onlyfans_clone`.
3. **Set Stripe keys:**
   - Replace Stripe secret and webhook keys in `payments.service.ts` and `stripe.webhook.controller.ts`.
4. **Run the server:**
   ```bash
   npm run start:dev
   ```

## API Endpoints

### Auth

- `POST /auth/register` — Register new user/creator
- `POST /auth/login` — Login and get JWT

### Users

- `GET /users/profile` — Get user profile (JWT required)
- `GET /users/creator-area` — Creator-only area
- `GET /users/user-area` — User-only area

### Photos

- `POST /photos/upload` — Upload photo (creator only)
- `POST /photos/list` — List accessible photos (JWT required)

### Subscriptions

- `POST /subscriptions/subscribe` — Subscribe to creator (user only)

### Payments

- `POST /payments/subscribe` — Create Stripe Checkout session
- `POST /payments/webhook` — Stripe webhook endpoint

## Environment Variables (Recommended)

- Use `@nestjs/config` for managing secrets and DB credentials.

## Notes

- For production, use S3/Cloudinary for photo storage.
- Secure Stripe keys and webhook secrets.
- Add more features as needed (admin, notifications, analytics).

---

© 2025 Your Project Name
