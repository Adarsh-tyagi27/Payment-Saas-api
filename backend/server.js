// server.js
const app = require('./src/app');
const env = require('./src/config/env');
const prisma = require('./src/config/database');

const PORT = env.PORT || 3000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 Payment SaaS API Running on http://localhost:${PORT} in ${env.NODE_ENV} mode`);
  
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});
