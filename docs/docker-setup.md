# Docker Setup Guide

This guide provides comprehensive instructions for containerizing the Saint Calendar application using Docker, enabling consistent deployment across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Dockerfile Configuration](#dockerfile-configuration)
- [Docker Compose Setup](#docker-compose-setup)
- [Environment Variables](#environment-variables)
- [Database Configuration](#database-configuration)
- [Building and Running](#building-and-running)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up Docker, ensure you have:

- **Docker Engine**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: For cloning the repository
- **Google Cloud Service Account**: For Google Sheets integration
- **PostgreSQL Database**: Either local or cloud-hosted

### System Requirements

- **RAM**: Minimum 4GB, recommended 8GB
- **Disk Space**: At least 5GB free space
- **Operating System**: Linux, macOS, or Windows with WSL2

## Dockerfile Configuration

Create a `Dockerfile` in the root directory of your project:

```dockerfile
# Use Node.js 18 Alpine as base image for smaller size
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && SKIP_ENV_VALIDATION=1 pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
```

### Key Dockerfile Features

- **Multi-stage build**: Reduces final image size by separating build and runtime stages
- **Alpine Linux**: Uses lightweight Node.js Alpine image
- **Security**: Runs as non-root user (nextjs)
- **Standalone output**: Uses Next.js standalone build for optimized production deployment
- **Port configuration**: Exposes port 3000 and configures hostname for container networking

## Docker Compose Setup

Create a `docker-compose.yml` file for development environment:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3000/api
      - DATABASE_URL=postgresql://saintcalendar:password@db:5432/saintcalendar
      - GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
    volumes:
      - .:/app
      - /app/node_modules
      - ./service-account-key.json:/app/service-account-key.json:ro
    depends_on:
      - db
    networks:
      - saintcalendar

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=saintcalendar
      - POSTGRES_USER=saintcalendar
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - saintcalendar

volumes:
  postgres_data:

networks:
  saintcalendar:
    driver: bridge
```

### Docker Compose for Production

Create a `docker-compose.prod.yml` for production:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://yourdomain.com/api
      - DATABASE_URL=${DATABASE_URL}
      - GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json
    volumes:
      - ./service-account-key.json:/app/service-account-key.json:ro
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - saintcalendar

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - saintcalendar
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  saintcalendar:
    driver: bridge
```

## Environment Variables

Create environment files for different stages:

### Development (.env.local)

```env
# Database
DATABASE_URL="postgresql://saintcalendar:password@localhost:5432/saintcalendar"

# Google Sheets API
GOOGLE_APPLICATION_CREDENTIALS="./service-account-key.json"

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_BASE_URL=http://localhost:3000

# Script Configuration
TEST_SPREADSHEET_ID=your-test-spreadsheet-id
SHEETS_API_DELAY_MS=1000

# Next.js
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### Production (.env.production)

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Google Sheets API
GOOGLE_APPLICATION_CREDENTIALS="/app/service-account-key.json"

# Application
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
API_BASE_URL=https://yourdomain.com

# Next.js
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Security
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://yourdomain.com
```

## Database Configuration

### Prisma with Docker

Update your `prisma/schema.prisma` to work with Docker:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}
```

### Database Initialization Script

Create `prisma/init.sql` for initial database setup:

```sql
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS saintcalendar;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE saintcalendar TO saintcalendar;
```

## Building and Running

### Development Environment

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/saintcalendar.git
   cd saintcalendar
   ```

2. **Copy environment file**:
   ```bash
   cp .env.example .env.local
   ```

3. **Place Google service account key**:
   ```bash
   # Place your service-account-key.json in the project root
   ```

4. **Start development environment**:
   ```bash
   docker-compose up --build
   ```

5. **Access the application**:
   - Application: http://localhost:3000
   - Database: localhost:5432

### Production Deployment

1. **Build production images**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Start production services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run database migrations**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
   ```

4. **Seed the database (optional)**:
   ```bash
   docker-compose -f docker-compose.prod.yml exec app npx prisma db seed
   ```

## Production Deployment

### Using Docker Registry

1. **Build and tag the image**:
   ```bash
   docker build -t saintcalendar:latest .
   docker tag saintcalendar:latest your-registry/saintcalendar:v1.0.0
   ```

2. **Push to registry**:
   ```bash
   docker push your-registry/saintcalendar:v1.0.0
   ```

3. **Deploy using registry image**:
   ```yaml
   # docker-compose.prod.yml
   services:
     app:
       image: your-registry/saintcalendar:v1.0.0
       # ... rest of configuration
   ```

### Health Checks

Add health checks to your Docker Compose:

```yaml
services:
  app:
    # ... other configuration
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    # ... other configuration
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U saintcalendar"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Troubleshooting

### Common Issues

#### Build Failures

**Issue**: `pnpm: command not found`
**Solution**: Ensure pnpm is available in the Docker image or use npm instead.

**Issue**: `Error: ENOENT: no such file or directory, stat '/app/.next/static'`
**Solution**: Check that the build process completed successfully and the `.next` directory exists.

#### Database Connection Issues

**Issue**: `Connection refused`
**Solution**: Ensure the database service is running and the connection string is correct.

**Issue**: `Authentication failed`
**Solution**: Verify database credentials in environment variables.

#### Google Sheets Integration

**Issue**: `Service account key not found`
**Solution**: Ensure the service account JSON file is mounted correctly and the path is accurate.

**Issue**: `Access denied`
**Solution**: Verify that the service account has the necessary permissions and the spreadsheet is shared.

#### Performance Issues

**Issue**: Slow container startup
**Solution**: Use Docker layer caching and optimize the Dockerfile.

**Issue**: High memory usage
**Solution**: Monitor resource usage and adjust Docker resource limits.

### Debugging Commands

**View container logs**:
```bash
docker-compose logs -f app
```

**Access container shell**:
```bash
docker-compose exec app sh
```

**Check database connectivity**:
```bash
docker-compose exec db psql -U saintcalendar -d saintcalendar
```

**Monitor resource usage**:
```bash
docker stats
```

### Useful Docker Commands

- **Stop all services**: `docker-compose down`
- **Rebuild without cache**: `docker-compose build --no-cache`
- **Clean up**: `docker system prune -a`
- **View running containers**: `docker ps`
- **View images**: `docker images`

## Next Steps

After setting up Docker:

1. Configure your production environment variables
2. Set up CI/CD pipeline (see CI/CD guide)
3. Configure monitoring and logging
4. Set up backup procedures for the database
5. Implement security best practices

For more advanced Docker configurations, refer to the official Docker documentation and Next.js deployment guides.