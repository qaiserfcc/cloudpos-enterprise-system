import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (_req, res) => {
  res.json({
    status: 'ok',
    service: 'transaction-service',
    timestamp: new Date().toISOString()
  });
});

// Basic authentication middleware for now
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }
  
  // Mock user for now
  (req as any).user = {
    userId: 'mock-user-id',
    email: 'cashier@example.com',
    role: 'cashier',
    storeId: 'mock-store-id',
    permissions: ['read_products', 'create_transactions']
  };
  
  next();
});

// Basic API info
app.get('/api', (_req, res) => {
  res.json({
    service: 'CloudPOS Transaction Service',
    version: '1.0.0',
    endpoints: {
      cart: '/api/cart',
      transactions: '/api/transactions'
    }
  });
});

// Error handling middleware
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error', error.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Transaction service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;