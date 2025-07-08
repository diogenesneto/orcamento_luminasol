// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
const { asyncHandler } = require('../middleware/errorHandler');
const { query } = require('express-validator');

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/dashboard/summary - Resumo geral
router.get('/summary', asyncHandler(dashboardController.getSummary));

// GET /api/dashboard/metrics - Métricas principais
router.get('/metrics', [
  query('period').optional().isIn(['today', 'week', 'month', 'year']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], asyncHandler(dashboardController.getMetrics));

// GET /api/dashboard/charts/revenue - Gráfico de receita
router.get('/charts/revenue', [
  query('period').optional().isIn(['7days', '30days', '90days', '12months']),
  query('groupBy').optional().isIn(['day', 'week', 'month'])
], asyncHandler(dashboardController.getRevenueChart));

// GET /api/dashboard/charts/budgets - Gráfico de orçamentos
router.get('/charts/budgets', [
  query('period').optional().isIn(['7days', '30days', '90days', '12months']),
  query('groupBy').optional().isIn(['status', 'type'])
], asyncHandler(dashboardController.getBudgetsChart));

// GET /api/dashboard/charts/conversion - Taxa de conversão
router.get('/charts/conversion', [
  query('period').optional().isIn(['7days', '30days', '90days', '12months'])
], asyncHandler(dashboardController.getConversionChart));

// GET /api/dashboard/activities - Atividades recentes
router.get('/activities', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], asyncHandler(dashboardController.getRecentActivities));

// GET /api/dashboard/top-clients - Principais clientes
router.get('/top-clients', [
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('orderBy').optional().isIn(['revenue', 'budgets', 'recent'])
], asyncHandler(dashboardController.getTopClients));

// GET /api/dashboard/notifications - Notificações
router.get('/notifications', [
  query('unreadOnly').optional().isBoolean()
], asyncHandler(dashboardController.getNotifications));

// PUT /api/dashboard/notifications/:id/read - Marcar notificação como lida
router.put('/notifications/:id/read', asyncHandler(dashboardController.markNotificationAsRead));

// GET /api/dashboard/performance - Performance da equipe
router.get('/performance', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], asyncHandler(dashboardController.getTeamPerformance));

// GET /api/dashboard/forecast - Previsão de vendas
router.get('/forecast', asyncHandler(dashboardController.getSalesForecast));

module.exports = router;
