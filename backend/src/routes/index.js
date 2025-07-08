// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const clientRoutes = require('./clients');
const budgetRoutes = require('./budgets');
const proposalRoutes = require('./proposals');
const dashboardRoutes = require('./dashboard');
const publicRoutes = require('./public');

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'LuminaSol API',
    version: '1.0.0',
    description: 'Sistema de Orçamentos Solares',
    endpoints: {
      auth: '/api/auth',
      clients: '/api/clients',
      budgets: '/api/budgets',
      proposals: '/api/proposals',
      dashboard: '/api/dashboard',
      public: '/api/public'
    },
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/budgets', budgetRoutes);
router.use('/proposals', proposalRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/public', publicRoutes);

// API Documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    message: 'API Documentation',
    documentation: {
      postman: '/api/docs/postman',
      openapi: '/api/docs/openapi',
      interactive: '/api/docs/interactive'
    }
  });
});

// Health check with detailed info
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(healthCheck);
});

module.exports = router;
