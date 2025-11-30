# OnlyFans Platform - Deployment & Setup Guide

## 📋 Overview

This guide provides comprehensive instructions for setting up and deploying the OnlyFans-like platform in various environments, from local development to production deployment.

## 🏁 Prerequisites

### System Requirements

#### Minimum Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux Ubuntu 18.04+
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **Memory**: 4GB RAM minimum
- **Storage**: 10GB available space

#### Recommended Requirements

- **Node.js**: v20.0.0 or higher
- **Memory**: 8GB RAM or more
- **Storage**: 50GB+ for production (includes file uploads)
- **CPU**: Multi-core processor

### Required Tools

```bash
# Install Node.js (using Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installations
node --version  # Should be v20.x.x
npm --version   # Should be v10.x.x

# Install PostgreSQL
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows (download from postgresql.org)
# Follow the installer instructions
```

## 🔧 Local Development Setup

### 1. Repository Setup

```bash
# Clone the repository
git clone <repository-url>
cd onlyfans-platform

# The project structure should look like:
# onlyfans-platform/
# ├── backend/          # NestJS API
# ├── frontend/         # Angular application
# ├── docs/            # Documentation
# └── README.md
```

### 2. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE onlyfans_dev;
CREATE USER onlyfans_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE onlyfans_dev TO onlyfans_user;
\q

# Connect to the new database and create initial schema
psql -h localhost -U onlyfans_user -d onlyfans_dev

# Create tables (if not using TypeORM migrations)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    UNIQUE(subscriber_id, creator_id)
);

CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, photo_id)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Create performance indexes
CREATE INDEX idx_photos_creator_id ON photos(creator_id);
CREATE INDEX idx_photos_is_premium ON photos(is_premium);
CREATE INDEX idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_photo_id ON likes(photo_id);
CREATE INDEX idx_comments_photo_id ON comments(photo_id);

\q
```

#### Alternative: Docker PostgreSQL

```yaml
# docker-compose.dev.yml
version: "3.8"
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: onlyfans_dev
      POSTGRES_USER: onlyfans_user
      POSTGRES_PASSWORD: dev_password_123
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  postgres_dev_data:
```

```bash
# Start PostgreSQL with Docker
docker-compose -f docker-compose.dev.yml up -d postgres
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# (See Environment Configuration section below)

# Run database migrations (if available)
npm run migration:run

# Start development server
npm run start:dev
```

**Backend Environment Configuration (`.env`)**:

```env
# Database Configuration
DATABASE_URL=postgresql://onlyfans_user:dev_password_123@localhost:5432/onlyfans_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Settings
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:4200

# Stripe Configuration (get from https://dashboard.stripe.com/)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PRICE_ID=price_subscription_monthly_price_id

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp

# Content Security
LOCKED_CONTENT_THUMBNAIL=/assets/locked-thumbnail.jpg
CONTENT_ENCRYPTION_KEY=your-content-encryption-key-here

# Social Features
ENABLE_LIKES=true
ENABLE_COMMENTS=true
MAX_COMMENT_LENGTH=500
COMMENT_MODERATION=false

# Security Settings
BCRYPT_SALT_ROUNDS=12
JWT_EXPIRATION=24h
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS Settings
CORS_ORIGIN=http://localhost:4200

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm start

# The application will be available at http://localhost:4200
```

### 5. Verify Setup

1. **Backend API**: Visit `http://localhost:3000/api/docs` for Swagger documentation
2. **Frontend Application**: Visit `http://localhost:4200`
3. **Database Connection**: Check backend logs for successful database connection

## 🚀 Production Deployment

### Environment Preparation

#### 1. Server Setup (Ubuntu 20.04 LTS)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install certbot (for SSL certificates)
sudo apt install certbot python3-certbot-nginx -y

# Install PM2 (for process management)
sudo npm install -g pm2
```

#### 2. Database Setup

```bash
# Create production database
sudo -u postgres psql

CREATE DATABASE onlyfans_prod;
CREATE USER onlyfans_prod_user WITH PASSWORD 'secure_production_password';
GRANT ALL PRIVILEGES ON DATABASE onlyfans_prod TO onlyfans_prod_user;

# Configure PostgreSQL for production
sudo nano /etc/postgresql/12/main/postgresql.conf
# Uncomment and set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/12/main/pg_hba.conf
# Add: local   onlyfans_prod   onlyfans_prod_user   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/onlyfans-platform
sudo chown $USER:$USER /var/www/onlyfans-platform
cd /var/www/onlyfans-platform

# Clone repository
git clone <repository-url> .

# Backend deployment
cd backend
npm ci --only=production
npm run build

# Create production environment file
sudo nano .env.production
# (See Production Environment Configuration below)

# Frontend deployment
cd ../frontend
npm ci
npm run build

# The built frontend will be in dist/ directory
```

**Production Environment Configuration**:

```env
# Database Configuration
DATABASE_URL=postgresql://onlyfans_prod_user:secure_production_password@localhost:5432/onlyfans_prod

# JWT Configuration
JWT_SECRET=extremely-secure-jwt-secret-256-characters-long

# Application Settings
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Stripe Configuration (LIVE keys)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_PRICE_ID=price_live_subscription_monthly_price_id

# File Upload Configuration
UPLOAD_PATH=/var/www/onlyfans-platform/uploads
MAX_FILE_SIZE=10485760  # 10MB for production
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,image/webp

# Content Security
LOCKED_CONTENT_THUMBNAIL=https://yourdomain.com/assets/locked-thumbnail.jpg
CONTENT_ENCRYPTION_KEY=production-content-encryption-key-secure
CDN_URL=https://cdn.yourdomain.com  # Optional CDN for file delivery

# Social Features
ENABLE_LIKES=true
ENABLE_COMMENTS=true
MAX_COMMENT_LENGTH=500
COMMENT_MODERATION=true  # Enable content moderation in production

# Security Settings
BCRYPT_SALT_ROUNDS=14  # Higher for production
JWT_EXPIRATION=24h
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=50   # Lower for production

# Performance Settings
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600  # 1 hour cache TTL
ENABLE_QUERY_CACHE=true

# CORS Settings
CORS_ORIGIN=https://yourdomain.com

# Logging Configuration
LOG_LEVEL=warn
LOG_FILE_PATH=/var/log/onlyfans
SENTRY_DSN=your-sentry-dsn-for-error-tracking  # Optional error tracking
```

#### 4. Process Management with PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: "onlyfans-api",
      script: "dist/main.js",
      cwd: "/var/www/onlyfans-platform/backend",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_file: ".env.production",
      error_file: "/var/log/onlyfans/api-error.log",
      out_file: "/var/log/onlyfans/api-out.log",
      log_file: "/var/log/onlyfans/api-combined.log",
      time: true,
    },
  ],
}
```

```bash
# Create log directory
sudo mkdir -p /var/log/onlyfans
sudo chown $USER:$USER /var/log/onlyfans

# Start application with PM2
cd /var/www/onlyfans-platform
pm2 start ecosystem.config.js

# Enable PM2 startup script
pm2 startup
pm2 save
```

#### 5. Nginx Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/onlyfans-platform
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend (Angular application)
    location / {
        root /var/www/onlyfans-platform/frontend/dist/onlyfans-frontend;
        index index.html;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file uploads
    location /uploads/ {
        root /var/www/onlyfans-platform;
        expires 1y;
        add_header Cache-Control "public";

        # Security: Prevent execution of uploaded files
        location ~* \.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/onlyfans-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### SSL/TLS Configuration

#### 1. Let's Encrypt (Recommended for production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal setup (should be automatic, but verify)
sudo crontab -e
# Add this line if not present:
0 12 * * * /usr/bin/certbot renew --quiet
```

#### 2. Custom SSL Certificate

```bash
# If you have your own SSL certificate
sudo mkdir -p /etc/nginx/ssl
sudo cp your-certificate.crt /etc/nginx/ssl/
sudo cp your-private-key.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*

# Update Nginx configuration with your certificate paths
```

## 🐳 Docker Deployment

### Complete Docker Setup

#### 1. Create Dockerfiles

**Backend Dockerfile**:

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**Frontend Dockerfile**:

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/onlyfans-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Frontend Nginx Configuration**:

```nginx
# frontend/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### 2. Docker Compose Configuration

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      REDIS_URL: redis://redis:6379
    volumes:
      - uploads_data:/app/uploads
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - uploads_data:/var/www/uploads
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  uploads_data:
```

#### 3. Environment Configuration

```bash
# .env for Docker Compose
DB_NAME=onlyfans_prod
DB_USER=onlyfans_user
DB_PASSWORD=secure_database_password

JWT_SECRET=your-super-secure-jwt-secret-here

STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Deployment commands
docker-compose up -d
docker-compose logs -f  # View logs
docker-compose down     # Stop services
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. Infrastructure Setup

**Using AWS CLI and CloudFormation**:

```yaml
# cloudformation-template.yml
AWSTemplateFormatVersion: "2010-09-09"
Description: "OnlyFans Platform Infrastructure"

Parameters:
  EnvironmentName:
    Description: Environment name prefix
    Type: String
    Default: onlyfans-prod

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC

  # RDS PostgreSQL Database
  DatabaseSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-db-subnet-group

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub ${EnvironmentName}-postgres
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: "14.6"
      MasterUsername: onlyfans_user
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: 20
      DBSubnetGroupName: !Ref DatabaseSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup

  # ElastiCache Redis
  RedisSubnetGroup:
    Type: AWS::ElastiCache::SubnetGroup
    Properties:
      Description: Subnet group for Redis
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2

  RedisCluster:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheNodes: 1
      CacheSubnetGroupName: !Ref RedisSubnetGroup
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${EnvironmentName}-cluster

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub ${EnvironmentName}-alb
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
```

#### 2. Container Deployment with ECS

```json
// task-definition.json
{
  "family": "onlyfans-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/onlyfans-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:password@rds-endpoint:5432/dbname"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/onlyfans-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3. CI/CD Pipeline with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: onlyfans-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster onlyfans-prod-cluster \
            --service onlyfans-backend-service \
            --force-new-deployment
```

### DigitalOcean Deployment

#### 1. Droplet Setup

```bash
# Create a new droplet (via CLI)
doctl compute droplet create onlyfans-prod \
  --image ubuntu-20-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc1 \
  --ssh-keys your-ssh-key-fingerprint

# Connect to droplet
ssh root@your-droplet-ip
```

#### 2. App Platform Deployment

```yaml
# .do/app.yaml
name: onlyfans-platform
services:
  - name: backend
    source_dir: /backend
    github:
      repo: your-username/onlyfans-platform
      branch: main
    run_command: npm run start:prod
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_TIME
        value: ${JWT_SECRET}
    routes:
      - path: /api

  - name: frontend
    source_dir: /frontend
    github:
      repo: your-username/onlyfans-platform
      branch: main
    build_command: npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    routes:
      - path: /

databases:
  - name: db
    engine: PG
    version: "14"
    size_slug: db-s-dev-database
```

## 📊 Monitoring and Maintenance

### Health Monitoring

#### 1. Application Health Checks

```typescript
// backend/src/health/health.controller.ts
@Controller("health")
export class HealthController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  @Get()
  async check(): Promise<any> {
    try {
      // Check database connection
      await this.userRepository.query("SELECT 1")

      // Check external services
      const stripeStatus = await this.checkStripeConnection()

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: "connected",
        stripe: stripeStatus ? "connected" : "disconnected",
      }
    } catch (error) {
      throw new ServiceUnavailableException({
        status: "error",
        message: error.message,
      })
    }
  }
}
```

#### 2. Monitoring with PM2

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Monitor application
pm2 monit

# View logs
pm2 logs onlyfans-api

# Restart application
pm2 restart onlyfans-api
```

### Backup Strategy

#### 1. Database Backups

```bash
# Create backup script
nano /home/backups/backup-db.sh
```

```bash
#!/bin/bash

# Database backup script
DB_NAME="onlyfans_prod"
DB_USER="onlyfans_prod_user"
BACKUP_DIR="/home/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
```

```bash
# Make executable and add to crontab
chmod +x /home/backups/backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
0 2 * * * /home/backups/backup-db.sh
```

#### 2. File Backups

```bash
# Backup uploaded files
rsync -avz /var/www/onlyfans-platform/uploads/ /home/backups/uploads/

# Automated backup script
nano /home/backups/backup-files.sh
```

```bash
#!/bin/bash

UPLOAD_DIR="/var/www/onlyfans-platform/uploads"
BACKUP_DIR="/home/backups/uploads"
DATE=$(date +%Y%m%d_%H%M%S)

# Create incremental backup
rsync -avz --link-dest=$BACKUP_DIR/latest $UPLOAD_DIR $BACKUP_DIR/$DATE

# Update latest symlink
rm -f $BACKUP_DIR/latest
ln -s $BACKUP_DIR/$DATE $BACKUP_DIR/latest

echo "File backup completed: $DATE"
```

### Security Maintenance

#### 1. Security Updates

```bash
# Regular security updates (Ubuntu)
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /var/www/onlyfans-platform/backend
npm audit fix

cd ../frontend
npm audit fix
```

#### 2. SSL Certificate Renewal

```bash
# Check certificate expiration
sudo certbot certificates

# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal
```

#### 3. Security Monitoring

```bash
# Monitor failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Monitor application logs for suspicious activity
tail -f /var/log/onlyfans/api-combined.log | grep -i "error\|fail\|attack"

# Check for unusual database connections
sudo -u postgres psql -d onlyfans_prod -c "SELECT * FROM pg_stat_activity;"
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connectivity
psql -h localhost -U onlyfans_prod_user -d onlyfans_prod

# Check connection limits
sudo -u postgres psql -c "SHOW max_connections;"
```

#### 2. Application Not Starting

```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs onlyfans-api --err

# Check environment variables
pm2 env 0  # Replace 0 with your app ID

# Restart application
pm2 restart onlyfans-api
```

#### 3. File Upload Issues

```bash
# Check upload directory permissions
ls -la /var/www/onlyfans-platform/uploads/

# Fix permissions if needed
sudo chown -R $USER:$USER /var/www/onlyfans-platform/uploads/
chmod 755 /var/www/onlyfans-platform/uploads/

# Check disk space
df -h
```

#### 4. SSL/HTTPS Issues

```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443

# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_photos_creator_premium ON photos(creator_id, is_premium);
CREATE INDEX CONCURRENTLY idx_subscriptions_active ON subscriptions(subscriber_id) WHERE status = 'active';

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM photos WHERE creator_id = 1 AND is_premium = true;
```

#### 2. Application Performance

```bash
# Enable Node.js performance monitoring
npm install clinic
clinic doctor -- node dist/main.js

# Monitor memory usage
ps aux | grep node
htop
```

---

This deployment guide covers all aspects of setting up the OnlyFans-like platform from development to production. Choose the deployment method that best fits your requirements and infrastructure preferences.
