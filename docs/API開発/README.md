# API Documentation

## Overview

This directory contains comprehensive documentation for the Saifuu API, which is built with Hono framework and uses Cloudflare D1 as the database.

## Architecture

- **Framework**: Hono (fast, lightweight web framework)
- **Database**: Cloudflare D1 (SQLite-based edge database)
- **ORM**: Drizzle ORM with D1 adapter
- **Runtime**: Cloudflare Workers
- **Testing**: Vitest with TDD approach

## Documentation Index

### 📚 Core Documentation

- **[Setup Guide](./setup.md)** - Basic API setup and development commands
- **[Endpoint Verification](./endpoint-verification.md)** - Comprehensive test results and API endpoint status
- **[Test Environment Setup](./test-environment-setup.md)** - TDD implementation and testing infrastructure

### 🗄️ Database Documentation

- **[D1 Migration Strategy](../データベース/d1-migration-strategy.md)** - Migration plan from better-sqlite3 to Cloudflare D1
- **[D1 Migration Success Report](../データベース/d1-migration-success.md)** - Complete migration results and verification

## API Endpoints

### Categories API
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get specific category

### Subscriptions API
- `GET /api/subscriptions` - List all subscriptions
- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions/:id` - Get specific subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Transactions API
- `GET /api/transactions` - List all transactions (支出のみ)
- `POST /api/transactions` - Create new transaction
- `GET /api/transactions/:id` - Get specific transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/stats` - Get transaction statistics

### Health Check
- `GET /api/health` - Database connectivity check

## Development Workflow

### Setup Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy to production
npm run deploy
```

### Database Commands
```bash
# Open Drizzle Studio
npm run db:studio

# Run migrations (local)
npm run db:migrate:local

# Run migrations (production)
npm run db:migrate:remote

# Generate migration files
npm run db:generate

# Seed database
npm run db:seed
```

### Testing Commands
```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage
npm run test:unit:coverage
```

## Key Features

### ✅ Implemented Features
- Complete CRUD operations for subscriptions and transactions
- Category management
- Database schema with proper relationships
- Comprehensive error handling
- TypeScript type safety
- Test-driven development approach
- **Unified validation framework** - Shared validation logic between API routes
- **Japanese error messages** - User-friendly error messages in Japanese

### 🔄 Migration Achievements
- Successfully migrated from better-sqlite3 to Cloudflare D1
- Unified development and production environments
- Maintained backward compatibility
- Improved performance and scalability

### 🧪 Test Coverage
- Unit tests for all API endpoints
- Integration tests with real database operations
- Error handling and edge case testing
- Performance and scalability validation
- Test helper files properly excluded from test execution and coverage

## Technical Details

### Validation Framework

The API uses a centralized validation framework located in `api/src/validation/schemas.ts` that provides:

- **Type-safe validation schemas** for all API endpoints
- **Reusable validators** for common fields (ID, amount, date, description)
- **Consistent error messages** in Japanese
- **Automatic type conversion** (e.g., string to number for category IDs)

Example usage:
```typescript
import { validateTransactionCreate } from '../validation/schemas';

const validationResult = validateTransactionCreate(requestBody);
if (!validationResult.success) {
  return c.json(formatValidationErrors(validationResult.errors), 400);
}
```

### Database Schema
```sql
-- Categories table
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'expense',
  color TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  billing_cycle TEXT NOT NULL,
  category_id INTEGER,
  next_payment_date TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Environment Configuration
- **Development**: Local D1 database via wrangler
- **Production**: Cloudflare D1 hosted database
- **Testing**: In-memory SQLite for fast test execution

## Troubleshooting

### Common Issues
1. **Database Connection Errors**: Check wrangler.jsonc D1 configuration
2. **Migration Failures**: Ensure proper D1 database setup
3. **Test Failures**: Verify test database initialization

### Support Resources
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Hono Framework Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## Contributing

When adding new API endpoints or features:
1. Write tests first (TDD approach)
2. Implement minimal functionality to pass tests
3. Add proper error handling
4. Update documentation
5. Ensure type safety

## Status

🎯 **Current Status**: Production Ready
- All API endpoints functional
- Database migration complete
- Comprehensive testing implemented
- Documentation up-to-date