// src/controllers/dashboardController.js
const { Op } = require('sequelize');
const { 
  User, 
  Client, 
  Budget, 
  Proposal, 
  Notification,
  sequelize 
} = require('../config/database');
const logger = require('../utils/logger');
const { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } = require('date-fns');

class DashboardController {
  /**
   * GET /api/dashboard/summary
   * Resumo geral do dashboard
   */
  async getSummary(req, res) {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Definir filtros baseados no role
      const clientWhere = isAdmin ? {} : { created_by: userId };
      const budgetWhere = isAdmin ? {} : { created_by: userId };

      // Buscar dados em paralelo
      const [
        totalClients,
        activeClients,
        totalBudgets,
        activeBudgets,
        acceptedBudgets,
        monthlyRevenue,
        pendingProposals,
        unreadNotifications
      ] = await Promise.all([
        // Total de clientes
        Client.count({ where: clientWhere }),
        
        // Clientes ativos
        Client.count({ 
          where: { 
            ...clientWhere, 
            status: 'active' 
          } 
        }),
        
        // Total de orçamentos
        Budget.count({ where: budgetWhere }),
        
        // Orçamentos ativos (não expirados)
        Budget.count({
          where: {
            ...budgetWhere,
            status: ['draft', 'sent', 'viewed'],
            validUntil: { [Op.gte]: new Date() }
          }
        }),
        
        // Orçamentos aceitos
        Budget.count({
          where: {
            ...budgetWhere,
            status: 'accepted'
          }
        }),
        
        // Receita do mês atual
        Budget.sum('financial.total', {
          where: {
            ...budgetWhere,
            status: 'accepted',
            createdAt: {
              [Op.gte]: startOfMonth(new Date()),
              [Op.lte]: endOfMonth(new Date())
            }
          }
        }),
        
        // Propostas pendentes
        Proposal.count({
          where: {
            status: ['sent', 'viewed']
          },
          include: [{
            model: Budget,
            as: 'budget',
            where: budgetWhere,
            required: true
          }]
        }),
        
        // Notificações não lidas
        Notification.count({
          where: {
            user_id: userId,
            isRead: false
          }
        })
      ]);

      // Calcular taxa de conversão
      const conversionRate = totalBudgets > 0 
        ? ((acceptedBudgets / totalBudgets) * 100).toFixed(1)
        : 0;

      // Comparação com mês anterior
      const lastMonthStart = startOfMonth(subDays(new Date(), 30));
      const lastMonthEnd = endOfMonth(subDays(new Date(), 30));
      
      const lastMonthRevenue = await Budget.sum('financial.total', {
        where: {
          ...budgetWhere,
          status: 'accepted',
          createdAt: {
            [Op.gte]: lastMonthStart,
            [Op.lte]: lastMonthEnd
          }
        }
      });

      const revenueGrowth = lastMonthRevenue > 0
        ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        data: {
          clients: {
            total: totalClients,
            active: activeClients,
            inactive: totalClients - activeClients
          },
          budgets: {
            total: totalBudgets,
            active: activeBudgets,
            accepted: acceptedBudgets,
            rejected: await Budget.count({ where: { ...budgetWhere, status: 'rejected' } }),
            pending: pendingProposals
          },
          revenue: {
            monthly: monthlyRevenue || 0,
            growth: parseFloat(revenueGrowth),
            lastMonth: lastMonthRevenue || 0
          },
          metrics: {
            conversionRate: parseFloat(conversionRate),
            avgTicket: acceptedBudgets > 0 ? (monthlyRevenue / acceptedBudgets) : 0,
            unreadNotifications
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar resumo do dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados do dashboard'
      });
    }
  }

  /**
   * GET /api/dashboard/metrics
   * Métricas detalhadas com filtros
   */
  async getMetrics(req, res) {
    try {
      const { period = 'month', startDate, endDate } = req.query;
      const isAdmin = req.user.role === 'admin';
      
      let dateFilter = {};
      
      // Configurar filtro de data
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            [Op.gte]: new Date(startDate),
            [Op.lte]: new Date(endDate)
          }
        };
      } else {
        switch (period) {
          case 'today':
            dateFilter = {
              createdAt: {
                [Op.gte]: startOfDay(new Date()),
                [Op.lte]: endOfDay(new Date())
              }
            };
            break;
          case 'week':
            dateFilter = {
              createdAt: {
                [Op.gte]: startOfWeek(new Date()),
                [Op.lte]: endOfWeek(new Date())
              }
            };
            break;
          case 'month':
            dateFilter = {
              createdAt: {
                [Op.gte]: startOfMonth(new Date()),
                [Op.lte]: endOfMonth(new Date())
              }
            };
            break;
          case 'year':
            dateFilter = {
              createdAt: {
                [Op.gte]: new Date(new Date().getFullYear(), 0, 1),
                [Op.lte]: new Date(new Date().getFullYear(), 11, 31)
              }
            };
            break;
        }
      }

      const baseWhere = isAdmin ? {} : { created_by: req.user.id };

      // Métricas de orçamentos
      const budgetMetrics = await Budget.findAll({
        where: { ...baseWhere, ...dateFilter },
        attributes: [
          'type',
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('financial.total')), 'total']
        ],
        group: ['type', 'status'],
        raw: true
      });

      // Métricas de clientes
      const newClients = await Client.count({
        where: { ...baseWhere, ...dateFilter }
      });

      // Propostas visualizadas
      const viewedProposals = await Proposal.count({
        where: {
          ...dateFilter,
          status: ['viewed', 'accepted']
        },
        include: [{
          model: Budget,
          as: 'budget',
          where: baseWhere,
          required: true
        }]
      });

      // Taxa de visualização
      const sentProposals = await Proposal.count({
        where: {
          ...dateFilter,
          status: { [Op.ne]: 'draft' }
        },
        include: [{
          model: Budget,
          as: 'budget',
          where: baseWhere,
          required: true
        }]
      });

      const viewRate = sentProposals > 0 
        ? ((viewedProposals / sentProposals) * 100).toFixed(1)
        : 0;

      // Processar métricas de orçamentos
      const budgetsByType = {
        solar: { count: 0, value: 0 },
        service: { count: 0, value: 0 }
      };

      const budgetsByStatus = {
        draft: { count: 0, value: 0 },
        sent: { count: 0, value: 0 },
        viewed: { count: 0, value: 0 },
        accepted: { count: 0, value: 0 },
        rejected: { count: 0, value: 0 }
      };

      budgetMetrics.forEach(metric => {
        if (budgetsByType[metric.type]) {
          budgetsByType[metric.type].count += parseInt(metric.count);
          budgetsByType[metric.type].value += parseFloat(metric.total || 0);
        }
        if (budgetsByStatus[metric.status]) {
          budgetsByStatus[metric.status].count += parseInt(metric.count);
          budgetsByStatus[metric.status].value += parseFloat(metric.total || 0);
        }
      });

      res.json({
        success: true,
        data: {
          period,
          dateRange: dateFilter.createdAt || null,
          budgets: {
            byType: budgetsByType,
            byStatus: budgetsByStatus,
            total: Object.values(budgetsByType).reduce((sum, item) => sum + item.count, 0)
          },
          clients: {
            new: newClients
          },
          proposals: {
            sent: sentProposals,
            viewed: viewedProposals,
            viewRate: parseFloat(viewRate)
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar métricas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar métricas'
      });
    }
  }

  /**
   * GET /api/dashboard/charts/revenue
   * Dados para gráfico de receita
   */
  async getRevenueChart(req, res) {
    try {
      const { period = '30days', groupBy = 'day' } = req.query;
      const isAdmin = req.user.role === 'admin';
      const baseWhere = isAdmin ? {} : { created_by: req.user.id };

      let startDate;
      const endDate = new Date();

      // Determinar período
      switch (period) {
        case '7days':
          startDate = subDays(endDate, 7);
          break;
        case '30days':
          startDate = subDays(endDate, 30);
          break;
        case '90days':
          startDate = subDays(endDate, 90);
          break;
        case '12months':
          startDate = subDays(endDate, 365);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      // Buscar dados de receita
      const revenueData = await Budget.findAll({
        where: {
          ...baseWhere,
          status: 'accepted',
          createdAt: {
            [Op.gte]: startDate,
            [Op.lte]: endDate
          }
        },
        attributes: [
          [sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('createdAt')), 'date'],
          [sequelize.fn('SUM', sequelize.col('financial.total')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE_TRUNC', groupBy, sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      // Formatar dados para o gráfico
      const chartData = revenueData.map(item => ({
        date: item.date,
        revenue: parseFloat(item.revenue || 0),
        count: parseInt(item.count || 0)
      }));

      // Calcular totais
      const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
      const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);

      res.json({
        success: true,
        data: {
          chart: chartData,
          summary: {
            total: totalRevenue,
            count: totalCount,
            average: totalCount > 0 ? totalRevenue / totalCount : 0
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar dados de receita:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de receita'
      });
    }
  }

  /**
   * GET /api/dashboard/activities
   * Atividades recentes
   */
  async getRecentActivities(req, res) {
    try {
      const { limit = 20 } = req.query;
      const isAdmin = req.user.role === 'admin';

      // Buscar atividades recentes
      const activities = [];

      // Novos clientes
      const recentClients = await Client.findAll({
        where: isAdmin ? {} : { created_by: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['name']
        }]
      });

      recentClients.forEach(client => {
        activities.push({
          type: 'client_created',
          title: 'Novo cliente cadastrado',
          description: `${client.name} foi adicionado`,
          user: client.creator?.name || 'Sistema',
          timestamp: client.createdAt,
          icon: 'user-plus',
          color: 'blue'
        });
      });

      // Orçamentos recentes
      const recentBudgets = await Budget.findAll({
        where: isAdmin ? {} : { created_by: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['name']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['name']
          }
        ]
      });

      recentBudgets.forEach(budget => {
        activities.push({
          type: 'budget_created',
          title: `Orçamento ${budget.type === 'solar' ? 'solar' : 'de serviços'} criado`,
          description: `${budget.budgetNumber} para ${budget.client?.name}`,
          user: budget.creator?.name || 'Sistema',
          timestamp: budget.createdAt,
          icon: budget.type === 'solar' ? 'sun' : 'tool',
          color: budget.type === 'solar' ? 'yellow' : 'green'
        });
      });

      // Propostas aceitas recentemente
      const acceptedProposals = await Proposal.findAll({
        where: {
          status: 'accepted',
          acceptedAt: {
            [Op.gte]: subDays(new Date(), 7)
          }
        },
        order: [['acceptedAt', 'DESC']],
        limit: 5,
        include: [{
          model: Budget,
          as: 'budget',
          where: isAdmin ? {} : { created_by: req.user.id },
          include: [{
            model: Client,
            as: 'client',
            attributes: ['name']
          }]
        }]
      });

      acceptedProposals.forEach(proposal => {
        activities.push({
          type: 'proposal_accepted',
          title: 'Proposta aceita!',
          description: `${proposal.budget.client?.name} aceitou a proposta ${proposal.proposalNumber}`,
          timestamp: proposal.acceptedAt,
          icon: 'check-circle',
          color: 'green',
          important: true
        });
      });

      // Ordenar por timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limitar quantidade
      const limitedActivities = activities.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: limitedActivities
      });
    } catch (error) {
      logger.error('Erro ao buscar atividades:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar atividades'
      });
    }
  }

  /**
   * GET /api/dashboard/top-clients
   * Principais clientes
   */
  async getTopClients(req, res) {
    try {
      const { limit = 10, orderBy = 'revenue' } = req.query;
      const isAdmin = req.user.role === 'admin';
      const baseWhere = isAdmin ? {} : { created_by: req.user.id };

      let order = [];
      let attributes = ['id', 'name', 'email', 'phone', 'status'];

      // Configurar ordenação
      switch (orderBy) {
        case 'revenue':
          // Buscar clientes com maior faturamento
          const clientsWithRevenue = await Client.findAll({
            where: baseWhere,
            attributes: [
              ...attributes,
              [
                sequelize.literal(`(
                  SELECT COALESCE(SUM(b.financial->>'total'::float), 0)
                  FROM budgets b
                  WHERE b.client_id = "Client".id
                  AND b.status = 'accepted'
                )`),
                'totalRevenue'
              ]
            ],
            order: [[sequelize.literal('totalRevenue'), 'DESC']],
            limit: parseInt(limit)
          });
          
          return res.json({
            success: true,
            data: clientsWithRevenue
          });

        case 'budgets':
          // Buscar clientes com mais orçamentos
          const clientsWithBudgets = await Client.findAll({
            where: baseWhere,
            attributes: [
              ...attributes,
              [
                sequelize.literal(`(
                  SELECT COUNT(*)
                  FROM budgets b
                  WHERE b.client_id = "Client".id
                )`),
                'budgetCount'
              ]
            ],
            order: [[sequelize.literal('budgetCount'), 'DESC']],
            limit: parseInt(limit)
          });
          
          return res.json({
            success: true,
            data: clientsWithBudgets
          });

        case 'recent':
        default:
          // Clientes mais recentes
          order = [['createdAt', 'DESC']];
          break;
      }

      const clients = await Client.findAll({
        where: baseWhere,
        attributes,
        order,
        limit: parseInt(limit),
        include: [{
          model: Budget,
          as: 'budgets',
          attributes: ['id', 'status', 'financial'],
          required: false
        }]
      });

      // Adicionar estatísticas
      const clientsWithStats = clients.map(client => {
        const clientData = client.toJSON();
        const budgets = clientData.budgets || [];
        
        return {
          ...clientData,
          stats: {
            totalBudgets: budgets.length,
            acceptedBudgets: budgets.filter(b => b.status === 'accepted').length,
            totalRevenue: budgets
              .filter(b => b.status === 'accepted')
              .reduce((sum, b) => sum + (b.financial?.total || 0), 0)
          }
        };
      });

      res.json({
        success: true,
        data: clientsWithStats
      });
    } catch (error) {
      logger.error('Erro ao buscar principais clientes:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar principais clientes'
      });
    }
  }

  /**
   * GET /api/dashboard/notifications
   * Buscar notificações do usuário
   */
  async getNotifications(req, res) {
    try {
      const { unreadOnly = false } = req.query;
      const where = {
        user_id: req.user.id
      };

      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const notifications = await Notification.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      logger.error('Erro ao buscar notificações:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar notificações'
      });
    }
  }

  /**
   * PUT /api/dashboard/notifications/:id/read
   * Marcar notificação como lida
   */
  async markNotificationAsRead(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
          user_id: req.user.id
        }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notificação não encontrada'
        });
      }

      await notification.markAsRead();

      res.json({
        success: true,
        message: 'Notificação marcada como lida'
      });
    } catch (error) {
      logger.error('Erro ao marcar notificação:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao marcar notificação'
      });
    }
  }

  /**
   * GET /api/dashboard/performance
   * Performance da equipe (admin only)
   */
  async getTeamPerformance(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      const { period = 'month' } = req.query;
      
      // Definir período
      let startDate;
      switch (period) {
        case 'week':
          startDate = startOfWeek(new Date());
          break;
        case 'month':
          startDate = startOfMonth(new Date());
          break;
        case 'quarter':
          startDate = subDays(new Date(), 90);
          break;
        case 'year':
          startDate = new Date(new Date().getFullYear(), 0, 1);
          break;
        default:
          startDate = startOfMonth(new Date());
      }

      // Buscar performance por usuário
      const users = await User.findAll({
        where: {
          role: ['admin', 'user'],
          isActive: true
        },
        attributes: ['id', 'name', 'email']
      });

      const performance = await Promise.all(users.map(async (user) => {
        const [
          budgetsCreated,
          budgetsAccepted,
          revenue,
          clientsCreated
        ] = await Promise.all([
          Budget.count({
            where: {
              created_by: user.id,
              createdAt: { [Op.gte]: startDate }
            }
          }),
          Budget.count({
            where: {
              created_by: user.id,
              status: 'accepted',
              createdAt: { [Op.gte]: startDate }
            }
          }),
          Budget.sum('financial.total', {
            where: {
              created_by: user.id,
              status: 'accepted',
              createdAt: { [Op.gte]: startDate }
            }
          }),
          Client.count({
            where: {
              created_by: user.id,
              createdAt: { [Op.gte]: startDate }
            }
          })
        ]);

        const conversionRate = budgetsCreated > 0
          ? ((budgetsAccepted / budgetsCreated) * 100).toFixed(1)
          : 0;

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          metrics: {
            budgetsCreated,
            budgetsAccepted,
            revenue: revenue || 0,
            clientsCreated,
            conversionRate: parseFloat(conversionRate)
          }
        };
      }));

      // Ordenar por receita
      performance.sort((a, b) => b.metrics.revenue - a.metrics.revenue);

      res.json({
        success: true,
        data: {
          period,
          startDate,
          performance
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar performance:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar performance da equipe'
      });
    }
  }

  /**
   * GET /api/dashboard/forecast
   * Previsão de vendas
   */
  async getSalesForecast(req, res) {
    try {
      const isAdmin = req.user.role === 'admin';
      const baseWhere = isAdmin ? {} : { created_by: req.user.id };

      // Buscar dados históricos dos últimos 6 meses
      const sixMonthsAgo = subDays(new Date(), 180);
      
      const historicalData = await Budget.findAll({
        where: {
          ...baseWhere,
          status: 'accepted',
          createdAt: { [Op.gte]: sixMonthsAgo }
        },
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
          [sequelize.fn('SUM', sequelize.col('financial.total')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      // Calcular tendência
      const revenues = historicalData.map(d => parseFloat(d.revenue || 0));
      const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
      
      // Calcular crescimento médio
      let growthRate = 0;
      if (revenues.length > 1) {
        const growthRates = [];
        for (let i = 1; i < revenues.length; i++) {
          if (revenues[i - 1] > 0) {
            growthRates.push((revenues[i] - revenues[i - 1]) / revenues[i - 1]);
          }
        }
        growthRate = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      }

      // Projetar próximos 3 meses
      const forecast = [];
      let lastRevenue = revenues[revenues.length - 1] || avgRevenue;
      
      for (let i = 1; i <= 3; i++) {
        const projectedRevenue = lastRevenue * (1 + growthRate);
        const month = new Date();
        month.setMonth(month.getMonth() + i);
        
        forecast.push({
          month: month.toISOString().substring(0, 7),
          revenue: projectedRevenue,
          isProjection: true
        });
        
        lastRevenue = projectedRevenue;
      }

      // Orçamentos em pipeline
      const pipeline = await Budget.sum('financial.total', {
        where: {
          ...baseWhere,
          status: ['sent', 'viewed'],
          validUntil: { [Op.gte]: new Date() }
        }
      });

      res.json({
        success: true,
        data: {
          historical: historicalData,
          forecast,
          summary: {
            avgMonthlyRevenue: avgRevenue,
            growthRate: (growthRate * 100).toFixed(1),
            pipeline: pipeline || 0,
            nextMonthProjection: forecast[0]?.revenue || 0
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao calcular previsão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao calcular previsão de vendas'
      });
    }
  }

  /**
   * GET /api/dashboard/charts/budgets
   * Gráfico de orçamentos por status/tipo
   */
  async getBudgetsChart(req, res) {
    try {
      const { period = '30days', groupBy = 'status' } = req.query;
      const isAdmin = req.user.role === 'admin';
      const baseWhere = isAdmin ? {} : { created_by: req.user.id };

      let startDate;
      switch (period) {
        case '7days':
          startDate = subDays(new Date(), 7);
          break;
        case '30days':
          startDate = subDays(new Date(), 30);
          break;
        case '90days':
          startDate = subDays(new Date(), 90);
          break;
        case '12months':
          startDate = subDays(new Date(), 365);
          break;
        default:
          startDate = subDays(new Date(), 30);
      }

      const dateFilter = {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lte]: new Date()
        }
      };

      const budgets = await Budget.findAll({
        where: { ...baseWhere, ...dateFilter },
        attributes: [
          groupBy,
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('financial.total')), 'total']
        ],
        group: [groupBy],
        raw: true
      });

      // Formatar dados
      const chartData = budgets.map(item => ({
        category: item[groupBy],
        count: parseInt(item.count || 0),
        value: parseFloat(item.total || 0)
      }));

      res.json({
        success: true,
        data: {
          chart: chartData,
          groupBy,
          period
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar dados de orçamentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados de orçamentos'
      });
    }
  }

  /**
   * GET /api/dashboard/charts/conversion
   * Taxa de conversão ao longo do tempo
   */
  async getConversionChart(req, res) {
    try {
      const { period = '30days' } = req.query;
      const isAdmin = req.user.role === 'admin';
      const baseWhere = isAdmin ? {} : { created_by: req.user.id };

      let startDate;
      let groupByPeriod = 'day';
      
      switch (period) {
        case '7days':
          startDate = subDays(new Date(), 7);
          groupByPeriod = 'day';
          break;
        case '30days':
          startDate = subDays(new Date(), 30);
          groupByPeriod = 'day';
          break;
        case '90days':
          startDate = subDays(new Date(), 90);
          groupByPeriod = 'week';
          break;
        case '12months':
          startDate = subDays(new Date(), 365);
          groupByPeriod = 'month';
          break;
      }

      const conversionData = await sequelize.query(`
        SELECT 
          DATE_TRUNC('${groupByPeriod}', b.created_at) as period,
          COUNT(DISTINCT b.id) as total_budgets,
          COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_budgets,
          CASE 
            WHEN COUNT(DISTINCT b.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END)::float / COUNT(DISTINCT b.id) * 100)
            ELSE 0 
          END as conversion_rate
        FROM budgets b
        WHERE b.created_at >= :startDate
          ${!isAdmin ? 'AND b.created_by = :userId' : ''}
        GROUP BY DATE_TRUNC('${groupByPeriod}', b.created_at)
        ORDER BY period ASC
      `, {
        replacements: {
          startDate,
          ...(isAdmin ? {} : { userId: req.user.id })
        },
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          chart: conversionData,
          period,
          groupBy: groupByPeriod
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar taxa de conversão:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar taxa de conversão'
      });
    }
  }
}

module.exports = new DashboardController();
