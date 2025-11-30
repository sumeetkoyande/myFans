# OnlyFans-like Application

This is a monorepo containing both frontend and backend applications for a photo-sharing subscription platform.

## Project Structure

```
.
├── backend/           # NestJS backend application
├── frontend/          # Angular frontend application
├── docs/              # Project documentation
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── TECHNICAL_DOCUMENTATION.md
│   └── TESTING_GUIDE.md
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database credentials
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Technical Documentation](./docs/TECHNICAL_DOCUMENTATION.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- [Testing Guide](./docs/TESTING_GUIDE.md)

## Technologies

### Backend

- NestJS
- TypeORM
- PostgreSQL
- Stripe
- JWT Authentication

### Frontend

- Angular 21
- Tailwind CSS
- RxJS
- Stripe Integration

## Development

Both applications are configured to work together:

- Backend: http://localhost:3000
- Frontend: http://localhost:4200
- API Docs: http://localhost:3000/api/docs

## Git Workflow

Only commit the following directories:

- `backend/` (excluding node_modules)
- `frontend/` (excluding node_modules, dist)
- `docs/`
- Root configuration files (README.md, .gitignore)

**Do not commit:**

- `node_modules/` (any level)
- `.env` files
- `dist/` folders
- `uploads/` directory
