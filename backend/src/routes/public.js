// src/routes/public.js
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { Proposal, Budget, Client, ProposalView } = require('../config/database');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const UAParser = require('ua-parser-js');

/**
 * GET /api/public/proposal/:link
 * Buscar proposta pelo link único (portal do cliente)
 */
router.get('/proposal/:link', asyncHandler(async (req, res) => {
  const { link } = req.params;

  const proposal = await Proposal.findOne({
    where: { unique_link: link },
    include: [
      {
        model: Budget,
        as: 'budget',
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'email', 'phone', 'address']
          }
        ]
      }
    ]
  });

  if (!proposal) {
    throw new NotFoundError('Proposta não encontrada');
  }

  // Verificar se está expirada
  if (proposal.isExpired()) {
    return res.status(410).json({
      success: false,
      error: 'Esta proposta expirou'
    });
  }

  // Registrar visualização
  const userAgent = req.headers['user-agent'];
  const parser = new UAParser(userAgent);
  const device = parser.getResult();

  await proposal.markAsViewed({
    ip_address: req.ip,
    user_agent: userAgent,
    device: {
      type: device.device.type || 'desktop',
      os: device.os.name,
      browser: device.browser.name,
      version: device.browser.version
    },
    referrer: req.headers.referer || null
  });

  // Preparar dados para o cliente
  const budget = proposal.budget;
  const responseData = {
    id: proposal.id,
    proposalNumber: proposal.proposalNumber,
    budgetNumber: budget.budgetNumber,
    status: proposal.status,
    viewedAt: proposal.firstViewedAt,
    acceptedAt: proposal.acceptedAt,
    client: {
      name: budget.client.name,
      phone: budget.client.phone,
      email: budget.client.email,
      address: budget.client.address
    },
    validUntil: budget.validUntil,
    customizations: proposal.customizations
  };

  // Adicionar dados específicos do tipo de orçamento
  if (budget.type === 'solar') {
    responseData.type = 'solar';
    responseData.system = {
      power: budget.solarData.system.systemPower,
      panels: budget.solarData.system.panelQuantity,
      panelModel: `${budget.solarData.system.panelPower}W`,
      inverter: `${budget.solarData.system.inverter.nominal}kW`,
      monthlyProduction: budget.solarData.production.monthlyAverage,
      yearlyProduction: budget.solarData.production.yearlyTotal
    };
    responseData.financial = {
      total: budget.financial.total,
      cashDiscount: budget.financial.total * 0.1,
      cashTotal: budget.financial.total * 0.9,
      installments: budget.financial.paymentConditions.installments.max,
      installmentValue: budget.financial.total / budget.financial.paymentConditions.installments.max,
      monthlyEconomy: budget.solarData.production.monthlyEconomy,
      yearlyEconomy: budget.solarData.production.yearlyEconomy,
      totalEconomy25Years: budget.solarData.production.yearlyEconomy * 25 * 1.07 // Com aumento de tarifa
    };
    responseData.materials = budget.materials ? budget.materials.split('\n') : [];
  } else if (budget.type === 'service') {
    responseData.type = 'service';
    responseData.services = budget.serviceData.items;
    responseData.financial = {
      total: budget.financial.total,
      cashDiscount: budget.financial.total * 0.1,
      cashTotal: budget.financial.total * 0.9,
      installments: budget.financial.paymentConditions.installments.max,
      installmentValue: budget.financial.total / budget.financial.paymentConditions.installments.max
    };
  }

  // Log da visualização
  logger.info(`Proposta visualizada: ${proposal.proposalNumber} por ${budget.client.name}`);

  res.json({
    success: true,
    data: responseData
  });
}));

/**
 * POST /api/public/proposal/:link/accept
 * Aceitar proposta
 */
router.post('/proposal/:link/accept', [
  param('link').notEmpty(),
  body('signature').optional().isString(),
  body('observations').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { link } = req.params;
  const { signature, observations } = req.body;

  const proposal = await Proposal.findOne({
    where: { unique_link: link },
    include: [{
      model: Budget,
      as: 'budget',
      include: [{
        model: Client,
        as: 'client'
      }]
    }]
  });

  if (!proposal) {
    throw new NotFoundError('Proposta não encontrada');
  }

  if (proposal.status === 'accepted') {
    return res.status(400).json({
      success: false,
      error: 'Esta proposta já foi aceita'
    });
  }

  if (proposal.isExpired()) {
    return res.status(410).json({
      success: false,
      error: 'Esta proposta expirou'
    });
  }

  // Aceitar proposta
  await proposal.accept({
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    signature,
    observations,
    timestamp: new Date()
  });

  if (signature) {
    proposal.clientSignature = signature;
    await proposal.save();
  }

  // Enviar notificações
  const emailService = require('../services/emailService');
  
  // Email para o vendedor/admin
  await emailService.sendProposalAccepted(proposal.budget.creator.email, {
    clientName: proposal.budget.client.name,
    clientPhone: proposal.budget.client.phone,
    proposalNumber: proposal.proposalNumber,
    value: proposal.budget.financial.total,
    systemPower: proposal.budget.solarData?.system.systemPower || 0
  });

  // Email de confirmação para o cliente
  await emailService.sendProposalAcceptanceConfirmation(proposal.budget.client.email, {
    clientName: proposal.budget.client.name,
    proposalNumber: proposal.proposalNumber,
    budgetNumber: proposal.budget.budgetNumber
  });

  logger.info(`Proposta aceita: ${proposal.proposalNumber} por ${proposal.budget.client.name}`);

  res.json({
    success: true,
    message: 'Proposta aceita com sucesso! Entraremos em contato em breve.',
    data: {
      proposalNumber: proposal.proposalNumber,
      acceptedAt: proposal.acceptedAt
    }
  });
}));

/**
 * POST /api/public/proposal/:link/reject
 * Rejeitar proposta
 */
router.post('/proposal/:link/reject', [
  param('link').notEmpty(),
  body('reason').optional().isString()
], asyncHandler(async (req, res) => {
  const { link } = req.params;
  const { reason } = req.body;

  const proposal = await Proposal.findOne({
    where: { unique_link: link },
    include: [{
      model: Budget,
      as: 'budget',
      include: [{
        model: Client,
        as: 'client'
      }]
    }]
  });

  if (!proposal) {
    throw new NotFoundError('Proposta não encontrada');
  }

  if (proposal.status === 'rejected') {
    return res.status(400).json({
      success: false,
      error: 'Esta proposta já foi recusada'
    });
  }

  // Rejeitar proposta
  await proposal.reject(reason);

  logger.info(`Proposta rejeitada: ${proposal.proposalNumber} - Motivo: ${reason || 'Não informado'}`);

  res.json({
    success: true,
    message: 'Proposta recusada. Agradecemos seu feedback.'
  });
}));

/**
 * GET /api/public/proposal/:link/download/:type
 * Download de documentos da proposta
 */
router.get('/proposal/:link/download/:type', asyncHandler(async (req, res) => {
  const { link, type } = req.params;

  if (!['word', 'pdf', 'excel'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: 'Tipo de documento inválido'
    });
  }

  const proposal = await Proposal.findOne({
    where: { unique_link: link }
  });

  if (!proposal) {
    throw new NotFoundError('Proposta não encontrada');
  }

  const documentUrl = proposal.documents[type];
  if (!documentUrl) {
    return res.status(404).json({
      success: false,
      error: 'Documento não disponível'
    });
  }

  // Incrementar contador de downloads
  proposal.downloadCount += 1;
  await proposal.save();

  // Redirecionar para o arquivo
  const fullUrl = `${process.env.API_URL || 'http://localhost:3001'}${documentUrl}`;
  res.redirect(fullUrl);
}));

/**
 * POST /api/public/proposal/:link/track
 * Rastrear ações na proposta (analytics)
 */
router.post('/proposal/:link/track', [
  body('action').notEmpty().isString(),
  body('data').optional().isObject()
], asyncHandler(async (req, res) => {
  const { link } = req.params;
  const { action, data } = req.body;

  const proposal = await Proposal.findOne({
    where: { unique_link: link }
  });

  if (!proposal) {
    throw new NotFoundError('Proposta não encontrada');
  }

  // Registrar ação no último view
  const lastView = await ProposalView.findOne({
    where: { proposal_id: proposal.id },
    order: [['createdAt', 'DESC']]
  });

  if (lastView) {
    const actions = lastView.actions || { clicks: [], scrollDepth: 0 };
    
    if (action === 'click') {
      actions.clicks.push({
        element: data.element,
        timestamp: new Date()
      });
    } else if (action === 'scroll') {
      actions.scrollDepth = Math.max(actions.scrollDepth, data.depth || 0);
    } else if (action === 'time') {
      lastView.duration = data.seconds || 0;
    }

    lastView.actions = actions;
    await lastView.save();
  }

  res.json({ success: true });
}));

/**
 * GET /api/public/company
 * Informações públicas da empresa
 */
router.get('/company', asyncHandler(async (req, res) => {
  const SystemConfig = require('../models/SystemConfig')(require('../config/database').sequelize);
  
  const configs = await SystemConfig.findAll({
    where: { 
      category: 'company',
      isPublic: true 
    }
  });

  const companyData = configs.reduce((acc, config) => {
    const key = config.key.replace('company.', '');
    acc[key] = config.value;
    return acc;
  }, {});

  res.json({
    success: true,
    data: companyData
  });
}));

module.exports = router;
