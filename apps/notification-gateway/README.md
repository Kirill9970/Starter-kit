# Notification Gateway Service

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Overview

Notification Gateway Service is responsible for managing real-time notifications and WebSocket connections in the microservices architecture. Built with NestJS, it provides a scalable solution for handling real-time communications.

## Features

- 🔔 Real-time Notifications
  - WebSocket support
  - Push notifications
  - Event broadcasting
- 🔌 Connection Management
  - Socket authentication
  - Connection pooling
  - Client tracking
- 📊 Monitoring
  - Connection statistics
  - Event logging
  - Performance metrics
- 🛠 Utilities
  - Redis pub/sub
  - Error handling
  - Reconnection strategies

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
DB_NAME=notification_gateway_db
DB_USERNAME=app_user
DB_PASSWORD=your_password
DB_PORT=5433

# RabbitMQ Configuration
RMQ_URL=amqp://@localhost:5672
RMQ_QUEUE=notification_gateway

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
├── gateway/       # WebSocket gateway implementations
├── guards/        # Authentication guards
├── websocket/     # WebSocket handlers
├── ws/           # WebSocket utilities
└── main.ts       # Application entry point
```

## WebSocket Events

The service handles the following WebSocket events:

- `connection`: Client connection event
- `disconnect`: Client disconnection event
- `message`: Message receiving event
- `broadcast`: Message broadcasting event

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
