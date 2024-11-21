# Deployment Documentation

## Overview

This document outlines the deployment process for the Wifey application, including environment setup, build configuration, and deployment strategies.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 18.x or higher
- MongoDB 6.x
- Redis (for caching)
- PostgreSQL (for Prisma)

### Required Services

- MongoDB Atlas account
- Vercel account (recommended)
- Sentry account (for error tracking)
- PostHog account (for analytics)

## Environment Setup

### Environment Variables

Create a `.env` file with the following variables:

```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=mongodb+srv://...
POSTGRES_URL=postgresql://...
REDIS_URL=redis://...

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Maps & Coverage
MAPS_API_KEY=your-maps-api-key
CARRIER_API_KEY=your-carrier-api-key

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key

# PWA
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

### SSL Certificates

For custom domains:
```bash
# Generate SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout private.key -out certificate.crt
```

## Build Process

### Production Build

```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Start production server
npm start
```

### Docker Build

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t wifey-app .
docker run -p 3000:3000 wifey-app
```

## Deployment Options

### 1. Vercel (Recommended)

1. Connect GitHub repository
2. Configure environment variables
3. Deploy:
```bash
vercel --prod
```

### 2. Docker & Kubernetes

kubernetes/deployment.yaml:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wifey-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wifey
  template:
    metadata:
      labels:
        app: wifey
    spec:
      containers:
      - name: wifey
        image: wifey-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: wifey-secrets
              key: database-url
```

Deploy:
```bash
kubectl apply -f kubernetes/deployment.yaml
```

### 3. Manual Deployment

Using PM2:
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "wifey" -- start

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

## Monitoring & Maintenance

### Health Checks

Create `/api/health` endpoint:
```typescript
export async function GET() {
  const isHealthy = await checkServices();
  return new Response(
    JSON.stringify({ status: isHealthy ? 'healthy' : 'unhealthy' }),
    { status: isHealthy ? 200 : 500 }
  );
}
```

### Logging

Configure logging in `next.config.js`:
```javascript
module.exports = {
  logging: {
    level: 'info',
    format: 'json',
    destination: '/var/log/wifey'
  }
}
```

### Backup Strategy

1. Database Backups:
```bash
# MongoDB backup
mongodump --uri="$DATABASE_URL" --out=/backups/$(date +%Y%m%d)

# PostgreSQL backup
pg_dump $POSTGRES_URL > /backups/postgres_$(date +%Y%m%d).sql
```

2. File Backups:
```bash
# Backup uploads and static files
rsync -av /app/public/uploads/ /backups/uploads/
```

### Monitoring Setup

1. Sentry Configuration:
```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

2. Performance Monitoring:
```typescript
export function monitorPerformance(name: string) {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      Sentry.captureMessage(`Performance: ${name}`, {
        level: 'info',
        extra: { duration },
      });
    },
  };
}
```

## Troubleshooting

### Common Issues

1. Database Connection:
```bash
# Test MongoDB connection
mongosh "$DATABASE_URL" --eval "db.runCommand({ ping: 1 })"

# Test PostgreSQL connection
psql "$POSTGRES_URL" -c "SELECT 1"
```

2. Memory Issues:
```bash
# Check memory usage
pm2 monit

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

3. Build Failures:
```bash
# Clear cache and node_modules
rm -rf .next node_modules
npm cache clean --force
npm ci
```

### Recovery Procedures

1. Database Recovery:
```bash
# Restore MongoDB backup
mongorestore --uri="$DATABASE_URL" /backups/latest/

# Restore PostgreSQL backup
psql $POSTGRES_URL < /backups/latest.sql
```

2. Application Recovery:
```bash
# Rollback to last working version
git reset --hard HEAD^
npm ci && npm run build
pm2 restart wifey
```

## Security Considerations

1. SSL/TLS Configuration:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private.key'),
  cert: fs.readFileSync('certificate.crt'),
};

https.createServer(options, app).listen(443);
```

2. Headers Configuration:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};
```

## Performance Optimization

1. Cache Configuration:
```typescript
// next.config.js
module.exports = {
  generateEtags: true,
  compress: true,
  poweredByHeader: false,
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};
```

2. Image Optimization:
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

## Continuous Integration/Deployment

GitHub Actions workflow:
```yaml
name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Build
      run: npm run build
    - name: Deploy to Vercel
      if: github.ref == 'refs/heads/main'
      run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
