# Redis Configuration and Cache Management

This package provides comprehensive Redis cache management and real-time pub/sub functionality for the Cloud POS system.

## Features

### 🚀 Cache Management
- **Session Management**: User sessions with configurable TTL
- **User Cache**: Fast user data retrieval with cache invalidation
- **Product Cache**: Product information caching for performance
- **Inventory Cache**: Real-time inventory level caching
- **Rate Limiting**: API rate limiting with sliding window
- **Temporary Data**: Short-term data storage with auto-expiration

### 📡 Real-time Communication
- **Pub/Sub Service**: Redis-based real-time messaging
- **Transaction Events**: Live transaction status updates
- **Payment Events**: Real-time payment processing updates
- **Inventory Events**: Live inventory and stock alerts
- **System Events**: Terminal status and system alerts

### 🔧 Key Features

#### Cache Strategies
```typescript
// User caching with TTL
await RedisManager.cacheUser(userId, userData, 3600); // 1 hour TTL
const user = await RedisManager.getCachedUser(userId);

// Product caching
await RedisManager.cacheProduct(productId, productData, 7200); // 2 hour TTL

// Inventory real-time caching
await RedisManager.cacheInventory(storeId, productId, inventory, 300); // 5 min TTL
```

#### Session Management
```typescript
// Create session
await RedisManager.setSession(sessionId, sessionData, 86400); // 24 hours

// Retrieve session
const session = await RedisManager.getSession(sessionId);

// Refresh session TTL
await RedisManager.refreshSession(sessionId, 86400);
```

#### Rate Limiting
```typescript
const result = await RedisManager.checkRateLimit(
  userId, 
  900000, // 15 minutes window
  100     // max 100 requests
);

if (!result.allowed) {
  // Rate limit exceeded
  throw new Error(`Rate limit exceeded. Reset at: ${result.resetTime}`);
}
```

#### Real-time Events
```typescript
// Initialize pub/sub service
const pubsub = new RedisPubSubService();

// Subscribe to transaction events
await pubsub.subscribeToTransactions(storeId, (data) => {
  console.log('Transaction event:', data);
});

// Publish transaction completed
await pubsub.publishTransactionCompleted(storeId, transactionData);
```

### 🏪 POS-Specific Features

#### Terminal Status Tracking
```typescript
// Set terminal online with heartbeat
await RedisManager.setTerminalStatus(terminalId, 'online', 60);

// Get all active terminals
const activeTerminals = await RedisManager.getActiveTerminals(storeId);
```

#### Active Transaction Management
```typescript
// Track active transactions
await RedisManager.addActiveTransaction(storeId, transactionId, 1800);

// Get all active transactions for store
const activeTransactions = await RedisManager.getActiveTransactions(storeId);
```

#### Real-time Inventory Updates
```typescript
// Subscribe to inventory changes
await pubsub.subscribeToInventory(storeId, (data) => {
  if (data.type === 'LOW_STOCK_ALERT') {
    // Handle low stock alert
  }
});

// Publish inventory update
await pubsub.publishInventoryUpdate(storeId, inventoryData);
```

### 📊 Performance Features

#### Cache Statistics
```typescript
// Increment counters for metrics
await RedisManager.incrementCounter('daily_sales', 1, 86400);

// Get counter value
const salesCount = await RedisManager.getCounter('daily_sales');
```

#### Health Monitoring
```typescript
// Check Redis health
const health = await RedisManager.healthCheck();
console.log('Redis connected:', health.connected);
console.log('Latency:', health.latency, 'ms');
console.log('Memory usage:', health.memory);
```

### 🧹 Cache Management

#### Pattern-based Cache Clearing
```typescript
// Clear all inventory cache for a store
await RedisManager.clearCacheByPattern(`inventory:${storeId}:*`);

// Clear all user sessions
await RedisManager.clearCacheByPattern('session:*');
```

## Redis Key Structure

The cache uses a structured key naming convention:

```
session:{sessionId}              - User sessions
user:{userId}                    - User data cache
product:{productId}              - Product information
inventory:{storeId}:{productId}  - Inventory levels
terminal:{terminalId}:status     - Terminal heartbeat
active_transactions:{storeId}    - Active transaction sets
rate_limit:{identifier}:{window} - Rate limiting counters
```

## Pub/Sub Channels

Real-time communication uses these channel patterns:

```
transaction:{storeId}    - Transaction events
payment:{terminalId}     - Payment status updates
inventory:{storeId}      - Inventory changes
system:alerts           - System-wide alerts
system:terminals        - Terminal status updates
```

## Configuration

Environment variables for Redis configuration:

```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_RETRY_DELAY_ON_FAILURE_MS=100
REDIS_MAX_RETRY_DELAY_ON_FAILURE_MS=3000
```

## Error Handling

All cache operations include comprehensive error handling:

- Connection failures are gracefully handled
- Parse errors are logged and don't crash the application
- Rate limit errors provide clear feedback with reset times
- Health checks monitor Redis connectivity and performance

This Redis implementation provides the foundation for high-performance, real-time POS operations with robust caching and messaging capabilities.