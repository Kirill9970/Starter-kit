# Authentication Service

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Overview

The Authentication Service is a crucial microservice component of our system, responsible for handling user authentication and authorization. Built with NestJS, it provides secure authentication mechanisms including OAuth2 support for multiple providers (Google, Twitter, Apple) and JWT-based authentication.

## Features

- 🔐 Multiple authentication strategies:
  - JWT-based authentication
  - Google OAuth2
  - Twitter OAuth
  - Apple Sign-in
- 🚀 High performance with Redis caching
- 🔄 Database replication support
- 🛡️ Rate limiting protection
- 📝 Swagger API documentation
- 🔍 Comprehensive logging system

## Prerequisites

- Node.js (LTS version)
- PNPM package manager
- PostgreSQL database
- Redis (for caching)
- RabbitMQ (for microservice communication)

## Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create and configure your `.env` file based on the template below:

```env
# Environment
NODE_ENV=local

# Encryption key
API_KEY_ENCRYPTION_SECRET=

# Authentication Configuration
AUTH_ACCESS_TOKEN_EXPIRES_IN=900000
AUTH_REFRESH_TOKEN_EXPIRES_IN=86400000
AUTH_TOKEN_SECRET=your_secret_key
AUTH_SESSION_CACHE_TTL=3600000
AUTH_MAX_SESSIONS_PER_USER=5

# Redis Configuration
REDIS_URL=redis://:password@localhost:6379/0

# Database Configuration
DB_HOST=127.0.0.1
DB_NAME=shared_db
DB_USERNAME=shared
DB_PASSWORD=your_password
DB_PORT=5433

# Database Replication Settings
RUN_MIGRATIONS=false
DB_REPLICATION=false
DB_REPLICATION_COUNT=2

# Replica 1 Configuration (if DB_REPLICATION=true)
DB_HOST_R_1=
DB_NAME_R_1=
DB_USERNAME_R_1=
DB_PASSWORD_R_1=
DB_PORT_R_1=

# RabbitMQ Services
AUTH_SERVICE_RMQ_URL=amqp://@localhost:5672
AUTH_SERVICE_RMQ_QUEUE=auth

USER_SERVICE_RMQ_URL=amqp://@localhost:5672
USER_SERVICE_RMQ_QUEUE=user

# Logging
LOG_LEVEL=info
```

## Running the Application

### Using Docker

The easiest way to run the service is using Docker:

```bash
# Start the service and dependencies
docker compose up

# Run in detached mode
docker compose up -d
```

### Local Development

```bash
# Development mode
pnpm run start:dev

# Debug mode
pnpm run start:debug

# Production mode
pnpm run build
pnpm run start:prod
```

## API Documentation

Once the service is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api/docs
```

## Testing

```bash
# Run tests
pnpm run test
```

## Project Structure

```
src/
├── config/         # Configuration files and environment variables
├── controllers/    # API endpoints and route handlers
├── dto/           # Data Transfer Objects for request/response validation
├── entities/      # Database entities and models
├── guards/        # Authentication and authorization guards
├── interfaces/    # TypeScript interfaces and types
├── services/      # Business logic and service layer
├── strategies/    # Authentication strategies implementation
└── main.ts        # Application entry point
```

## Available Scripts

- `pnpm run start:dev` - Start the application in development mode
- `pnpm run start:debug` - Start the application in debug mode
- `pnpm run build` - Build the application
- `pnpm run start:prod` - Start the application in production mode
- `pnpm run lint` - Run ESLint
- `pnpm run format` - Format code using Prettier
- `pnpm run test` - Run tests

## Dependencies

Key dependencies include:

- NestJS framework and its modules
- TypeORM for database operations
- Passport.js for authentication
- Redis for caching
- RabbitMQ for message queuing
- Winston for logging

For a complete list of dependencies, see `package.json`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   - Verify database credentials in `.env`
   - Ensure PostgreSQL is running
   - Check network connectivity

2. **Authentication Errors**

   - Verify OAuth credentials
   - Check JWT configuration
   - Ensure Redis is running for session management

3. **Performance Issues**
   - Check Redis connection
   - Verify database indexes
   - Monitor RabbitMQ queue size

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.
