// src/controllers/budgetController.js
const { Budget, Client, User, Proposal, BudgetItem } = require('../config/database');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const documentService = require('../services/documentService');
const emailService = require('../services/emailService');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

class BudgetController {
  /**
   * Calcula sistema solar
   */
  calculateSolarSystem(solarData) {
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

  /**
   * GET /api/budgets
   * Lista orçamentos (implementado em routes/budgets.js)
   */

  /**
   * GET /api/budgets/:id
   * Busca orçamento (implementado em routes/budgets.js)
   */

  /**
   * POST /api/budgets/solar
   * Cria orçamento solar
   */
  async createSolar(req, res) {
    try {
      const { clientId, solarData, materials, observations, settings } = req.body;

      // Verificar se o cliente existe
      const client = await Client.findByPk(clientId);
      if (!client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para criar orçamento para este cliente'
        });
      }

      // Calcular valores do sistema
      const calculations = this.calculateSolarSystem(solarData);

      // Criar orçamento
      const budget = await Budget.create({
        client_id: clientId,
        created_by: req.user.id,
        type: 'solar',
        solarData: calculations,
        financial: {
          subtotal: calculations.calculations.subtotal,
          discount: 0,
          discountType: 'percentage',
          tax: calculations.calculations.tax,
          total: calculations.calculations.total,
          paymentConditions: {
            cash: { discount: 10 },
            installments: { max: 18, interest: 0 },
            financing: { available: true }
          }
        },
        materials: materials || this.getDefaultMaterials(),
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

      logger.info(`Orçamento solar criado: ${budget.budgetNumber} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: completeBudget,
        message: 'Orçamento solar criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar orçamento solar:', error);
      throw error;
    }
  }

  /**
   * POST /api/budgets/service
   * Cria orçamento de serviços
   */
  async createService(req, res) {
    try {
      const { clientId, serviceData, observations, settings } = req.body;

      // Verificar se o cliente existe
      const client = await Client.findByPk(clientId);
      if (!client) {
        throw new NotFoundError('Cliente não encontrado');
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para criar orçamento para este cliente'
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
          type: 'service',
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

      logger.info(`Orçamento de serviços criado: ${budget.budgetNumber} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        data: completeBudget,
        message: 'Orçamento de serviços criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar orçamento de serviços:', error);
      throw error;
    }
  }

  /**
   * PUT /api/budgets/:id
   * Atualiza orçamento
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const budget = await Budget.findByPk(id, {
        include: [
          { model: Client, as: 'client' },
          { model: BudgetItem, as: 'items' }
        ]
      });
      
      if (!budget) {
        throw new NotFoundError('Orçamento não encontrado');
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && budget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para editar este orçamento'
        });
      }

      // Verificar se pode editar (apenas rascunhos)
      if (budget.status !== 'draft') {
        throw new ValidationError('Apenas orçamentos em rascunho podem ser editados');
      }

      // Atualizar dados conforme o tipo
      if (budget.type === 'solar' && req.body.solarData) {
        const calculations = this.calculateSolarSystem(req.body.solarData);
        budget.solarData = calculations;
        budget.financial.total = calculations.calculations.total;
        budget.financial.subtotal = calculations.calculations.subtotal;
        budget.financial.tax = calculations.calculations.tax;
      }

      if (budget.type === 'service' && req.body.serviceData) {
        const total = req.body.serviceData.items.reduce((sum, item) => {
          return sum + (item.quantity * item.unitPrice);
        }, 0);
        
        budget.serviceData = {
          items: req.body.serviceData.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        };
        
        budget.financial.total = total;
        budget.financial.subtotal = total;

        // Atualizar itens
        await BudgetItem.destroy({ where: { budget_id: budget.id } });
        
        if (req.body.serviceData.items.length > 0) {
          const items = req.body.serviceData.items.map(item => ({
            budget_id: budget.id,
            type: 'service',
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.quantity * item.unitPrice
          }));

          await BudgetItem.bulkCreate(items);
        }
      }

      // Atualizar outros campos
      if (req.body.materials !== undefined) budget.materials = req.body.materials;
      if (req.body.observations !== undefined) budget.observations = req.body.observations;
      if (req.body.settings) {
        budget.settings = { ...budget.settings, ...req.body.settings };
        
        // Atualizar validade se mudou
        if (req.body.settings.validityDays) {
          budget.validUntil = new Date(Date.now() + req.body.settings.validityDays * 24 * 60 * 60 * 1000);
        }
      }

      await budget.save();

      // Buscar orçamento atualizado
      const updatedBudget = await Budget.findByPk(budget.id, {
        include: [
          { model: Client, as: 'client' },
          { model: User, as: 'creator' },
          { model: BudgetItem, as: 'items' }
        ]
      });

      logger.info(`Orçamento atualizado: ${budget.budgetNumber} por ${req.user.email}`);

      res.json({
        success: true,
        data: updatedBudget,
        message: 'Orçamento atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar orçamento:', error);
      throw error;
    }
  }

  /**
   * POST /api/budgets/:id/generate
   * Gera documentos do orçamento
   */
  async generateDocuments(req, res) {
    try {
      const { id } = req.params;
      const budget = await Budget.findByPk(id, {
        include: [
          { model: Client, as: 'client' },
          { model: User, as: 'creator' }
        ]
      });

      if (!budget) {
        throw new NotFoundError('Orçamento não encontrado');
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && budget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para gerar documentos deste orçamento'
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
          },
          customizations: budget.settings
        });
      } else {
        // Atualizar documentos
        proposal.documents = {
          ...proposal.documents,
          word: wordDoc.url,
          excel: excelDoc.url
        };
        await proposal.save();
      }

      logger.info(`Documentos gerados para orçamento: ${budget.budgetNumber}`);

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
      throw error;
    }
  }

  /**
   * POST /api/budgets/:id/send
   * Envia orçamento ao cliente
   */
  async send(req, res) {
    try {
      const { id } = req.params;
      const { method = 'email', message } = req.body;
      
      const budget = await Budget.findByPk(id, {
        include: [
          { model: Client, as: 'client' },
          { model: Proposal, as: 'proposal' }
        ]
      });

      if (!budget) {
        throw new NotFoundError('Orçamento não encontrado');
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && budget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para enviar este orçamento'
        });
      }

      // Verificar se a proposta existe
      if (!budget.proposal) {
        throw new ValidationError('Gere os documentos antes de enviar');
      }

      // Gerar link único
      const proposalLink = budget.proposal.getPublicUrl();

      // Enviar conforme o método
      if (method === 'email') {
        await emailService.sendProposal(budget.client.email, {
          clientName: budget.client.name,
          budgetNumber: budget.budgetNumber,
          proposalLink: proposalLink,
          customMessage: message
        });

        // Notificar vendedor que enviou
        await emailService.sendProposalSentNotification(req.user.email, {
          clientName: budget.client.name,
          budgetNumber: budget.budgetNumber,
          proposalLink: proposalLink
        });
      }

      // Atualizar status
      budget.status = 'sent';
      budget.proposal.status = 'sent';
      budget.proposal.sentAt = new Date();
      
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

      logger.info(`Orçamento enviado: ${budget.budgetNumber} via ${method}`);

      res.json({
        success: true,
        data: {
          proposalLink,
          whatsappLink,
          status: budget.status
        },
        message: `Orçamento enviado com sucesso via ${method}`
      });
    } catch (error) {
      logger.error('Erro ao enviar orçamento:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/budgets/:id
   * Remove orçamento
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const budget = await Budget.findByPk(id);
      
      if (!budget) {
        throw new NotFoundError('Orçamento não encontrado');
      }

      // Apenas admin pode deletar
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Apenas administradores podem remover orçamentos'
        });
      }

      // Verificar se tem proposta aceita
      const proposal = await Proposal.findOne({ 
        where: { 
          budget_id: id,
          status: 'accepted'
        } 
      });

      if (proposal) {
        throw new ValidationError('Não é possível remover orçamento com proposta aceita');
      }

      // Soft delete
      await budget.destroy();

      logger.info(`Orçamento removido: ${budget.budgetNumber} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Orçamento removido com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao remover orçamento:', error);
      throw error;
    }
  }

  /**
   * GET /api/budgets/:id/duplicate
   * Duplica um orçamento
   */
  async duplicate(req, res) {
    try {
      const { id } = req.params;
      const originalBudget = await Budget.findByPk(id);

      if (!originalBudget) {
        throw new NotFoundError('Orçamento não encontrado');
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && originalBudget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para duplicar este orçamento'
        });
      }

      // Criar cópia
      const newBudget = await Budget.create({
        client_id: originalBudget.client_id,
        created_by: req.user.id,
        type: originalBudget.type,
        solarData: originalBudget.solarData,
        serviceData: originalBudget.serviceData,
        financial: originalBudget.financial,
        materials: originalBudget.materials,
        observations: originalBudget.observations,
        settings: originalBudget.settings,
        status: 'draft',
        version: originalBudget.version + 1,
        parentBudgetId: originalBudget.id
      });

      // Copiar itens se for serviço
      if (originalBudget.type === 'service') {
        const items = await BudgetItem.findAll({ 
          where: { budget_id: originalBudget.id } 
        });

        if (items.length > 0) {
          const newItems = items.map(item => ({
            budget_id: newBudget.id,
            type: item.type,
            category: item.category,
            description: item.description,
            details: item.details,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price,
            cost: item.cost,
            discount: item.discount,
            tax: item.tax,
            metadata: item.metadata,
            order: item.order,
            isOptional: item.isOptional,
            isIncluded: item.isIncluded
          }));

          await BudgetItem.bulkCreate(newItems);
        }
      }

      // Buscar orçamento completo
      const completeBudget = await Budget.findByPk(newBudget.id, {
        include: [
          { model: Client, as: 'client' },
          { model: User, as: 'creator' },
          { model: BudgetItem, as: 'items' }
        ]
      });

      logger.info(`Orçamento duplicado: ${originalBudget.budgetNumber} -> ${newBudget.budgetNumber}`);

      res.json({
        success: true,
        data: completeBudget,
        message: 'Orçamento duplicado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao duplicar orçamento:', error);
      throw error;
    }
  }

  /**
   * Lista de materiais padrão
   */
  getDefaultMaterials() {
    return `Painéis Solares Fotovoltaicos
Inversor de Frequência
Cabos Solares CC/CA
Estrutura de Fixação para Telhado
Stringbox DC e CA
Conectores MC4
Disjuntores DC e AC
DPS - Dispositivo de Proteção contra Surtos
Parafusos e Acessórios para Fixação
Sistema de Aterramento
Etiquetas de Identificação e Sinalização`;
  }
}

module.exports = new BudgetController();
