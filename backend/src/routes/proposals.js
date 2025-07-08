// src/routes/proposals.js
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const proposalController = require('../controllers/proposalController');
const { asyncHandler } = require('../middleware/errorHandler');

// Validações
const updateProposalValidation = [
  body('customizations').optional().isObject(),
  body('customizations.showPrices').optional().isBoolean(),
  body('customizations.showPaymentOptions').optional().isBoolean(),
  body('customizations.showTechnicalDetails').optional().isBoolean(),
  body('customizations.showEconomyProjection').optional().isBoolean(),
  body('customizations.customMessage').optional().isString(),
  body('customizations.theme').optional().isIn(['default', 'modern', 'classic'])
];

// Todas as rotas autenticadas
router.use(authenticate);

// GET /api/proposals - Listar propostas
router.get('/', asyncHandler(proposalController.index));

// GET /api/proposals/stats - Estatísticas
router.get('/stats', asyncHandler(proposalController.stats));

// GET /api/proposals/:id - Buscar proposta
router.get('/:id', 
  param('id').isUUID(),
  asyncHandler(proposalController.show)
);

// PUT /api/proposals/:id - Atualizar proposta
router.put('/:id',
  param('id').isUUID(),
  updateProposalValidation,
  asyncHandler(proposalController.update)
);

// POST /api/proposals/:id/resend - Reenviar proposta
router.post('/:id/resend',
  param('id').isUUID(),
  body('method').optional().isIn(['email', 'whatsapp']),
  body('message').optional().isString(),
  asyncHandler(proposalController.resend)
);

// GET /api/proposals/:id/views - Visualizações da proposta
router.get('/:id/views',
  param('id').isUUID(),
  asyncHandler(proposalController.getViews)
);

// DELETE /api/proposals/:id - Remover proposta
router.delete('/:id',
  param('id').isUUID(),
  authorize('admin'),
  asyncHandler(proposalController.destroy)
);

module.exports = router;
