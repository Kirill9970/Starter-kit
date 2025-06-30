# User-service

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

User Service is responsible for managing user data, profiles, and user-related operations in the microservices architecture. Built with NestJS, it provides a robust and scalable solution for user management.

## Features

- 👤 User Management
  - User profiles
  - User preferences
  - Account settings
- 🔄 Data Synchronization
  - Real-time updates
  - Cache management
- 🔐 Security
  - Data encryption
  - Access control
- 📊 Monitoring
  - User activity tracking
  - System health checks

## Prerequisites

- Node.js (v20 or higher)
- pnpm
- PostgreSQL
- Redis
- RabbitMQ

## Installation

```bash
$ pnpm install
```

## Configuration

Create a `.env` file in the service root directory with the following configuration:

```env
# Environment
NODE_ENV=local

# Encryption key
API_KEY_ENCRYPTION_SECRET=

# Redis Configuration
REDIS_URL=redis://:password@localhost:6379/0

# Database Configuration
DB_HOST=127.0.0.1
DB_NAME=shared_db
DB_USERNAME=shared
DB_PASSWORD=your_password
DB_PORT=5433

# RabbitMQ Services
AUTH_SERVICE_RMQ_URL=amqp://@localhost:5672
AUTH_SERVICE_RMQ_QUEUE=auth

USER_SERVICE_RMQ_URL=amqp://@localhost:5672
USER_SERVICE_RMQ_QUEUE=user

# Logging
LOG_LEVEL=info
```

## Running the Application

### Using Docker (optional)

```bash
$ sudo docker compose up
```

### Local Development

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Project Structure

```
src/
├── controllers/    # API endpoints and route handlers
├── services/      # Business logic layer
├── interfaces/    # TypeScript interfaces
├── entities/      # Database entities
└── main.ts        # Application entry point
```

## API Documentation

The service exposes its API documentation through Swagger. Once running, you can access it at:

```
http://localhost:3000/api/docs
```

## Testing

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
