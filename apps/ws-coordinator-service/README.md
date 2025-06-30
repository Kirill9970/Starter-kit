# WebSocket Coordinator Service

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Overview

WebSocket Coordinator Service is responsible for managing and coordinating WebSocket connections across the microservices architecture. Built with NestJS, it provides centralized WebSocket management and coordination.

## Features

- 🔄 Connection Coordination
  - Connection load balancing
  - Session management
  - Service discovery
- 📊 Monitoring
  - Connection metrics
  - Service health checks
  - Performance monitoring
- 🛠 Management Tools
  - Connection debugging
  - Service registration
  - Load distribution
- 🔐 Security
  - Connection authentication
  - Access control
  - Rate limiting

## Prerequisites

- Node.js (v18 or higher)
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
DB_NAME=ws_coordinator_service_db
DB_USERNAME=app_user
DB_PASSWORD=your_password
DB_PORT=5433

# RabbitMQ Configuration
COORDINATOR_SERVICE_RMQ_URL=amqp://@localhost:5672
COORDINATOR_SERVICE_RMQ_QUEUE=ws_coordinator_service

# Logging
LOG_LEVEL=info
```

## Running the Application

### Using Docker

```bash
$ docker compose up
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
├── client/       # Client implementations
├── controller/   # API endpoints
├── coordinator/  # Coordination logic
├── entity/       # Database entities
├── services/     # Business logic
└── main.ts       # Application entry point
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
