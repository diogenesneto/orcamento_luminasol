// src/controllers/proposalController.js
const { Proposal, Budget, Client, ProposalView, User } = require('../config/database');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const documentService = require('../services/documentService');

class ProposalController {
  /**
   * GET /api/proposals
   * Lista todas as propostas
   */
  async index(req, res) {
    try {
      const {
        status,
        budgetType,
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
          model: Budget,
          as: 'budget',
          required: true,
          where: {},
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'name', 'phone', 'email']
            },
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name']
            }
          ]
        }
      ];

      // Filtros baseados no role
      if (req.user.role !== 'admin') {
        includeClause[0].where.created_by = req.user.id;
      }

      // Filtros
      if (status) whereClause.status = status;
      
      if (budgetType) {
        includeClause[0].where.type = budgetType;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }

      // Busca
      if (search) {
        whereClause[Op.or] = [
          { proposalNumber: { [Op.iLike]: `%${search}%` } },
          { '$budget.budgetNumber$': { [Op.iLike]: `%${search}%` } },
          { '$budget.client.name$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Paginação
      const offset = (page - 1) * limit;

      const { count, rows } = await Proposal.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Adicionar URL pública
      const proposalsWithUrls = rows.map(proposal => ({
        ...proposal.toJSON(),
        publicUrl: proposal.getPublicUrl()
      }));

      res.json({
        success: true,
        data: proposalsWithUrls,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Erro ao listar propostas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao listar propostas'
      });
    }
  }

  /**
   * GET /api/proposals/:id
   * Busca proposta por ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const proposal = await Proposal.findByPk(id, {
        include: [
          {
            model: Budget,
            as: 'budget',
            include: [
              {
                model: Client,
                as: 'client'
              },
              {
                model: User,
                as: 'creator'
              }
            ]
          },
          {
            model: ProposalView,
            as: 'views',
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposta não encontrada'
        });
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && proposal.budget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para acessar esta proposta'
        });
      }

      res.json({
        success: true,
        data: {
          ...proposal.toJSON(),
          publicUrl: proposal.getPublicUrl()
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar proposta:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar proposta'
      });
    }
  }

  /**
   * PUT /api/proposals/:id
   * Atualiza proposta
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { customizations } = req.body;

      const proposal = await Proposal.findByPk(id, {
        include: [{
          model: Budget,
          as: 'budget'
        }]
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposta não encontrada'
        });
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && proposal.budget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para editar esta proposta'
        });
      }

      // Atualizar customizações
      if (customizations) {
        proposal.customizations = {
          ...proposal.customizations,
          ...customizations
        };
      }

      await proposal.save();

      res.json({
        success: true,
        message: 'Proposta atualizada com sucesso',
        data: proposal
      });
    } catch (error) {
      logger.error('Erro ao atualizar proposta:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar proposta'
      });
    }
  }

  /**
   * POST /api/proposals/:id/resend
   * Reenviar proposta
   */
  async resend(req, res) {
    try {
      const { id } = req.params;
      const { method = 'email', message } = req.body;

      const proposal = await Proposal.findByPk(id, {
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
        return res.status(404).json({
          success: false,
          error: 'Proposta não encontrada'
        });
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && proposal.budget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para reenviar esta proposta'
        });
      }

      const proposalLink = proposal.getPublicUrl();

      if (method === 'email') {
        await emailService.sendProposal(proposal.budget.client.email, {
          clientName: proposal.budget.client.name,
          budgetNumber: proposal.budget.budgetNumber,
          proposalLink: proposalLink,
          customMessage: message
        });

        // Registrar envio
        proposal.emailsSent = [
          ...proposal.emailsSent,
          {
            sentAt: new Date(),
            sentBy: req.user.name,
            method: 'email',
            message
          }
        ];
        await proposal.save();
      }

      // Gerar link WhatsApp se solicitado
      let whatsappLink = null;
      if (method === 'whatsapp') {
        const whatsappMessage = documentService.formatWhatsAppMessage(
          proposal.budget,
          proposal.budget.client,
          proposalLink
        );
        whatsappLink = `https://wa.me/55${proposal.budget.client.phone.replace(/\D/g, '')}?text=${whatsappMessage}`;
      }

      logger.info(`Proposta reenviada: ${proposal.proposalNumber} via ${method}`);

      res.json({
        success: true,
        message: `Proposta reenviada via ${method}`,
        data: {
          proposalLink,
          whatsappLink
        }
      });
    } catch (error) {
      logger.error('Erro ao reenviar proposta:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao reenviar proposta'
      });
    }
  }

  /**
   * GET /api/proposals/:id/views
   * Visualizações da proposta
   */
  async getViews(req, res) {
    try {
      const { id } = req.params;

      const proposal = await Proposal.findByPk(id, {
        include: [{
          model: Budget,
          as: 'budget'
        }]
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposta não encontrada'
        });
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && proposal.budget.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para acessar visualizações'
        });
      }

      const views = await ProposalView.findAll({
        where: { proposal_id: id },
        order: [['createdAt', 'DESC']]
      });

      // Estatísticas de visualização
      const stats = {
        totalViews: views.length,
        uniqueViews: new Set(views.map(v => v.ip_address)).size,
        avgDuration: views.reduce((sum, v) => sum + (v.duration || 0), 0) / views.length || 0,
        devices: {
          mobile: views.filter(v => v.device?.type === 'mobile').length,
          tablet: views.filter(v => v.device?.type === 'tablet').length,
          desktop: views.filter(v => v.device?.type === 'desktop').length
        }
      };

      res.json({
        success: true,
        data: {
          views,
          stats
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar visualizações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar visualizações'
      });
    }
  }

  /**
   * DELETE /api/proposals/:id
   * Remove proposta
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const proposal = await Proposal.findByPk(id, {
        include: [{
          model: Budget,
          as: 'budget'
        }]
      });

      if (!proposal) {
        return res.status(404).json({
          success: false,
          error: 'Proposta não encontrada'
        });
      }

      // Apenas admin pode deletar
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Apenas administradores podem remover propostas'
        });
      }

      // Soft delete
      await proposal.destroy();

      logger.info(`Proposta removida: ${proposal.proposalNumber} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Proposta removida com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao remover proposta:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao remover proposta'
      });
    }
  }

  /**
   * GET /api/proposals/stats
   * Estatísticas de propostas
   */
  async stats(req, res) {
    try {
      const baseWhere = {};
      
      if (req.user.role !== 'admin') {
        baseWhere['$budget.created_by$'] = req.user.id;
      }

      const [
        totalProposals,
        sentProposals,
        viewedProposals,
        acceptedProposals,
        rejectedProposals,
        avgViewsPerProposal,
        avgTimeToAccept
      ] = await Promise.all([
        // Total
        Proposal.count({
          where: baseWhere,
          include: [{
            model: Budget,
            as: 'budget',
            attributes: []
          }]
        }),

        // Enviadas
        Proposal.count({
          where: { ...baseWhere, status: 'sent' },
          include: [{
            model: Budget,
            as: 'budget',
            attributes: []
          }]
        }),

        // Visualizadas
        Proposal.count({
          where: { ...baseWhere, status: ['viewed', 'accepted', 'rejected'] },
          include: [{
            model: Budget,
            as: 'budget',
            attributes: []
          }]
        }),

        // Aceitas
        Proposal.count({
          where: { ...baseWhere, status: 'accepted' },
          include: [{
            model: Budget,
            as: 'budget',
            attributes: []
          }]
        }),

        // Rejeitadas
        Proposal.count({
          where: { ...baseWhere, status: 'rejected' },
          include: [{
            model: Budget,
            as: 'budget',
            attributes: []
          }]
        }),

        // Média de visualizações
        ProposalView.count() / (await Proposal.count() || 1),

        // Tempo médio para aceitar (em dias)
        Proposal.findAll({
          where: { 
            ...baseWhere, 
            status: 'accepted',
            acceptedAt: { [Op.ne]: null }
          },
          attributes: [
            [sequelize.fn('AVG', 
              sequelize.literal("EXTRACT(EPOCH FROM (accepted_at - sent_at))/86400")
            ), 'avgDays']
          ],
          include: [{
            model: Budget,
            as: 'budget',
            attributes: []
          }],
          raw: true
        }).then(result => result[0]?.avgDays || 0)
      ]);

      // Taxas
      const viewRate = sentProposals > 0 
        ? ((viewedProposals / sentProposals) * 100).toFixed(1)
        : 0;

      const acceptRate = viewedProposals > 0
        ? ((acceptedProposals / viewedProposals) * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        data: {
          total: totalProposals,
          byStatus: {
            draft: totalProposals - sentProposals,
            sent: sentProposals - viewedProposals,
            viewed: viewedProposals - acceptedProposals - rejectedProposals,
            accepted: acceptedProposals,
            rejected: rejectedProposals
          },
          rates: {
            view: parseFloat(viewRate),
            accept: parseFloat(acceptRate)
          },
          averages: {
            viewsPerProposal: avgViewsPerProposal.toFixed(1),
            daysToAccept: avgTimeToAccept.toFixed(1)
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de propostas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas'
      });
    }
  }
}

module.exports = new ProposalController();
