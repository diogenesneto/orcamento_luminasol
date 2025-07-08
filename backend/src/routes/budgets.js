// src/routes/budgets.js
const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');
const { Budget, Client, User } = require('../config/database');
const documentService = require('../services/documentService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Middleware de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validações para orçamento solar
const solarBudgetValidation = [
  body('clientId').isUUID().withMessage('ID do cliente inválido'),
  body('solarData.system.desiredPower').isFloat({ min: 0 }).withMessage('Potência desejada inválida'),
  body('solarData.system.panelPower').isFloat({ min: 0 }).withMessage('Potência do painel inválida'),
  body('solarData.system.magicNumber').isFloat({ min: 0 }).withMessage('Número mágico inválido'),
  body('solarData.calculations.laborPerKwp').isFloat({ min: 0 }).withMessage('Valor de mão de obra inválido'),
  body('solarData.calculations.profitMargin').isFloat({ min: 0, max: 100 }).withMessage('Margem de lucro inválida')
];

// Validações para orçamento de serviços
const serviceBudgetValidation = [
  body('clientId').isUUID().withMessage('ID do cliente inválido'),
  body('serviceData.items').isArray({ min: 1 }).withMessage('Deve incluir pelo menos um serviço'),
  body('serviceData.items.*.description').notEmpty().withMessage('Descrição do serviço obrigatória'),
  body('serviceData.items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade inválida'),
  body('serviceData.items.*.unitPrice').isFloat({ min: 0 }).withMessage('Valor unitário inválido')
];

/**
 * GET /api/budgets
 * Lista todos os orçamentos com filtros
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      type,
      status,
      clientId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    const includeClause = [
      {
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'phone', 'email']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name', 'email']
      }
    ];

    // Aplicar filtros
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (clientId) whereClause.client_id = clientId;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    // Busca por texto
    if (search) {
      whereClause[Op.or] = [
        { budgetNumber: { [Op.iLike]: `%${search}%` } },
        { '$client.name$': { [Op.iLike]: `%${search}%` } },
        { '$client.phone$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Paginação
    const offset = (page - 1) * limit;

    const { count, rows } = await Budget.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Erro ao listar orçamentos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar orçamentos' 
    });
  }
});

/**
 * GET /api/budgets/:id
 * Busca orçamento por ID
 */
router.get('/:id', authenticate, [
  param('id').isUUID().withMessage('ID inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'name']
          }]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: BudgetItem,
          as: 'items'
        },
        {
          model: Proposal,
          as: 'proposal'
        }
      ]
    });

    if (!budget) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orçamento não encontrado' 
      });
    }

    res.json({
      success: true,
      data: budget
    });
  } catch (error) {
    logger.error('Erro ao buscar orçamento:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar orçamento' 
    });
  }
});

/**
 * POST /api/budgets/solar
 * Cria novo orçamento solar
 */
router.post('/solar', authenticate, solarBudgetValidation, handleValidationErrors, async (req, res) => {
  try {
    const { clientId, solarData, materials, observations, settings } = req.body;

    // Verificar se o cliente existe
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente não encontrado' 
      });
    }

    // Calcular valores do sistema
    const calculations = calculateSolarSystem(solarData);

    // Criar orçamento
    const budget = await Budget.create({
      client_id: clientId,
      created_by: req.user.id,
      type: 'solar',
      solarData: {
        ...solarData,
        ...calculations
      },
      financial: {
        subtotal: calculations.subtotal,
        discount: 0,
        discountType: 'percentage',
        tax: calculations.tax,
        total: calculations.total,
        paymentConditions: {
          cash: { discount: 10 },
          installments: { max: 18, interest: 0 },
          financing: { available: true }
        }
      },
      materials,
      observations,
      settings: {
        includeInstallation: true,
        includeHomologation: true,
        warrantyYears: 1,
        validityDays: settings?.validityDays || 15,
        showEconomyProjection: true,
        showFinancingOptions: true,
        ...settings
      },
      status: 'draft'
    });

    // Buscar orçamento completo
    const completeBudget = await Budget.findByPk(budget.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'creator' }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeBudget,
      message: 'Orçamento solar criado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao criar orçamento solar:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar orçamento solar' 
    });
  }
});

/**
 * POST /api/budgets/service
 * Cria novo orçamento de serviços
 */
router.post('/service', authenticate, serviceBudgetValidation, handleValidationErrors, async (req, res) => {
  try {
    const { clientId, serviceData, observations, settings } = req.body;

    // Verificar se o cliente existe
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Cliente não encontrado' 
      });
    }

    // Calcular total dos serviços
    const total = serviceData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    // Criar orçamento
    const budget = await Budget.create({
      client_id: clientId,
      created_by: req.user.id,
      type: 'service',
      serviceData: {
        items: serviceData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      },
      financial: {
        subtotal: total,
        discount: 0,
        discountType: 'percentage',
        tax: 0,
        total: total,
        paymentConditions: {
          cash: { discount: 10 },
          installments: { max: 12, interest: 0 },
          financing: { available: false }
        }
      },
      observations,
      settings: {
        validityDays: settings?.validityDays || 15,
        ...settings
      },
      status: 'draft'
    });

    // Criar itens do orçamento
    if (serviceData.items && serviceData.items.length > 0) {
      const items = serviceData.items.map(item => ({
        budget_id: budget.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice
      }));

      await BudgetItem.bulkCreate(items);
    }

    // Buscar orçamento completo
    const completeBudget = await Budget.findByPk(budget.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'creator' },
        { model: BudgetItem, as: 'items' }
      ]
    });

    res.status(201).json({
      success: true,
      data: completeBudget,
      message: 'Orçamento de serviços criado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao criar orçamento de serviços:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao criar orçamento de serviços' 
    });
  }
});

/**
 * PUT /api/budgets/:id
 * Atualiza orçamento
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orçamento não encontrado' 
      });
    }

    // Verificar se pode editar (apenas rascunhos)
    if (budget.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        error: 'Apenas orçamentos em rascunho podem ser editados' 
      });
    }

    // Atualizar dados conforme o tipo
    if (budget.type === 'solar' && req.body.solarData) {
      const calculations = calculateSolarSystem(req.body.solarData);
      budget.solarData = { ...req.body.solarData, ...calculations };
      budget.financial.total = calculations.total;
    }

    if (budget.type === 'service' && req.body.serviceData) {
      const total = req.body.serviceData.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      budget.serviceData = req.body.serviceData;
      budget.financial.total = total;
    }

    // Atualizar outros campos
    if (req.body.materials) budget.materials = req.body.materials;
    if (req.body.observations) budget.observations = req.body.observations;
    if (req.body.settings) budget.settings = { ...budget.settings, ...req.body.settings };

    await budget.save();

    res.json({
      success: true,
      data: budget,
      message: 'Orçamento atualizado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar orçamento' 
    });
  }
});

/**
 * POST /api/budgets/:id/generate
 * Gera documentos do orçamento
 */
router.post('/:id/generate', authenticate, async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: User, as: 'creator' }
      ]
    });

    if (!budget) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orçamento não encontrado' 
      });
    }

    // Gerar documentos
    const [wordDoc, excelDoc] = await Promise.all([
      documentService.generateProposal(budget, budget.client, {
        responsibleName: budget.creator.name,
        panelBrand: req.body.panelBrand,
        panelModel: req.body.panelModel,
        inverterBrand: req.body.inverterBrand
      }),
      documentService.generateExcel(budget, budget.client)
    ]);

    // Criar proposta se ainda não existir
    let proposal = await Proposal.findOne({ where: { budget_id: budget.id } });
    
    if (!proposal) {
      proposal = await Proposal.create({
        budget_id: budget.id,
        status: 'draft',
        documents: {
          word: wordDoc.url,
          excel: excelDoc.url
        }
      });
    }

    res.json({
      success: true,
      data: {
        documents: {
          word: wordDoc,
          excel: excelDoc
        },
        proposal: proposal
      },
      message: 'Documentos gerados com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao gerar documentos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar documentos' 
    });
  }
});

/**
 * POST /api/budgets/:id/send
 * Envia orçamento ao cliente
 */
router.post('/:id/send', authenticate, async (req, res) => {
  try {
    const { method = 'email', message } = req.body;
    
    const budget = await Budget.findByPk(req.params.id, {
      include: [
        { model: Client, as: 'client' },
        { model: Proposal, as: 'proposal' }
      ]
    });

    if (!budget) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orçamento não encontrado' 
      });
    }

    // Verificar se a proposta existe
    if (!budget.proposal) {
      return res.status(400).json({ 
        success: false, 
        error: 'Gere os documentos antes de enviar' 
      });
    }

    // Gerar link único
    const proposalLink = documentService.generateUniqueLink(budget.proposal.id);

    // Enviar conforme o método
    if (method === 'email') {
      await emailService.sendProposal(budget.client.email, {
        clientName: budget.client.name,
        budgetNumber: budget.budgetNumber,
        proposalLink: proposalLink,
        customMessage: message
      });
    }

    // Atualizar status
    budget.status = 'sent';
    budget.proposal.status = 'sent';
    budget.proposal.unique_link = proposalLink;
    
    await Promise.all([
      budget.save(),
      budget.proposal.save()
    ]);

    // Se for WhatsApp, gerar link
    let whatsappLink = null;
    if (method === 'whatsapp' || req.body.includeWhatsApp) {
      const whatsappMessage = documentService.formatWhatsAppMessage(
        budget,
        budget.client,
        proposalLink
      );
      whatsappLink = `https://wa.me/55${budget.client.phone.replace(/\D/g, '')}?text=${whatsappMessage}`;
    }

    res.json({
      success: true,
      data: {
        proposalLink,
        whatsappLink,
        status: budget.status
      },
      message: 'Orçamento enviado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao enviar orçamento:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao enviar orçamento' 
    });
  }
});

/**
 * DELETE /api/budgets/:id
 * Remove orçamento (soft delete)
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ 
        success: false, 
        error: 'Orçamento não encontrado' 
      });
    }

    // Soft delete
    await budget.destroy();

    res.json({
      success: true,
      message: 'Orçamento removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover orçamento:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao remover orçamento' 
    });
  }
});

/**
 * Função auxiliar para calcular sistema solar
 */
function calculateSolarSystem(solarData) {
  const { system, calculations, production } = solarData;
  
  // Cálculo de painéis
  const panelQuantity = Math.ceil(
    ((system.desiredPower / system.magicNumber) * 1000) / system.panelPower
  );
  const systemPower = (panelQuantity * system.panelPower) / 1000;
  
  // Seleção do inversor
  const inverters = [3, 5, 7.5, 8, 10, 15, 20, 25, 30, 50, 75];
  const minPower = systemPower / 1.6;
  const selectedInverter = inverters.find(inv => inv >= minPower) || inverters[inverters.length - 1];
  
  // Cálculo financeiro
  const kitValue = calculations.kitValueMethod === 'perKwp' 
    ? systemPower * 1000 * calculations.valuePerKwp
    : calculations.kitValue;
    
  const laborValue = systemPower * calculations.laborPerKwp;
  const taxBase = calculations.materialValue + laborValue;
  const tax = taxBase * 0.06;
  const subtotal = kitValue + calculations.materialValue + laborValue + tax;
  const profit = subtotal * (calculations.profitMargin / 100);
  const commission = calculations.enableCommission 
    ? profit * (calculations.commissionPercentage / 100) 
    : 0;
  const total = subtotal + profit + commission;
  
  // Cálculo de produção (Manaus)
  const seasonalFactors = [0.914, 0.93, 0.935, 0.886, 0.898, 1.016, 1.025, 1.141, 1.131, 1.101, 1.071, 0.953];
  const baseProduction = 107.88; // kWh/kWp/mês
  const monthlyProductions = seasonalFactors.map(f => systemPower * baseProduction * f);
  const monthlyAverage = monthlyProductions.reduce((a, b) => a + b, 0) / 12;
  const yearlyTotal = monthlyAverage * 12;
  const monthlyEconomy = monthlyAverage * production.tariff;
  const yearlyEconomy = monthlyEconomy * 12;
  
  return {
    system: {
      ...system,
      panelQuantity,
      systemPower,
      inverter: {
        nominal: selectedInverter,
        maximum: selectedInverter * 1.6,
        minRequired: minPower
      }
    },
    calculations: {
      ...calculations,
      kitValue,
      laborValue,
      tax,
      profit,
      commission,
      subtotal,
      total
    },
    production: {
      ...production,
      monthlyAverage,
      yearlyTotal,
      monthlyEconomy,
      yearlyEconomy
    }
  };
}

module.exports = router;
