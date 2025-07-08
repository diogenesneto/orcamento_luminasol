// src/controllers/clientController.js
const { Client, User, Budget, Proposal } = require('../config/database');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class ClientController {
  /**
   * GET /api/clients
   * Lista todos os clientes com filtros e paginação
   */
  async index(req, res) {
    try {
      const {
        search,
        status,
        type,
        tags,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const whereClause = {};
      
      // Filtros baseados no role do usuário
      if (req.user.role !== 'admin') {
        whereClause.created_by = req.user.id;
      }

      // Filtro de busca
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { cpf_cnpj: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Filtros específicos
      if (status) whereClause.status = status;
      if (type) whereClause.type = type;
      if (tags) {
        whereClause.tags = {
          [Op.contains]: Array.isArray(tags) ? tags : [tags]
        };
      }

      // Paginação
      const offset = (page - 1) * limit;

      const { count, rows } = await Client.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            required: false
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name']
          },
          {
            model: Budget,
            as: 'budgets',
            attributes: ['id', 'status', 'type'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]],
        distinct: true
      });

      // Adicionar estatísticas aos clientes
      const clientsWithStats = rows.map(client => {
        const clientData = client.toJSON();
        const budgets = clientData.budgets || [];
        
        return {
          ...clientData,
          stats: {
            totalBudgets: budgets.length,
            acceptedBudgets: budgets.filter(b => b.status === 'accepted').length,
            pendingBudgets: budgets.filter(b => ['draft', 'sent', 'viewed'].includes(b.status)).length
          }
        };
      });

      res.json({
        success: true,
        data: clientsWithStats,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Erro ao listar clientes:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao listar clientes'
      });
    }
  }

  /**
   * GET /api/clients/:id
   * Busca cliente por ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const client = await Client.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'lastLogin']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name']
          },
          {
            model: Budget,
            as: 'budgets',
            include: [{
              model: Proposal,
              as: 'proposal'
            }],
            order: [['createdAt', 'DESC']]
          }
        ]
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado'
        });
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para acessar este cliente'
        });
      }

      // Calcular estatísticas
      const budgets = client.budgets || [];
      const stats = {
        totalBudgets: budgets.length,
        totalValue: budgets
          .filter(b => b.status === 'accepted')
          .reduce((sum, b) => sum + (b.financial?.total || 0), 0),
        lastBudgetDate: budgets[0]?.createdAt || null,
        conversionRate: budgets.length > 0 
          ? (budgets.filter(b => b.status === 'accepted').length / budgets.length * 100).toFixed(1)
          : 0
      };

      res.json({
        success: true,
        data: {
          ...client.toJSON(),
          stats
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar cliente'
      });
    }
  }

  /**
   * POST /api/clients
   * Cria novo cliente
   */
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        name,
        email,
        phone,
        whatsapp,
        cpf_cnpj,
        type,
        address,
        notes,
        tags,
        energyData,
        createUser
      } = req.body;

      // Verificar duplicados
      const existingClient = await Client.findOne({
        where: {
          [Op.or]: [
            { email },
            { cpf_cnpj: cpf_cnpj || null }
          ]
        }
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          error: 'Cliente já cadastrado com este email ou CPF/CNPJ'
        });
      }

      // Criar usuário se solicitado
      let userId = null;
      if (createUser) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const user = await User.create({
          name,
          email,
          password: tempPassword,
          phone,
          role: 'client'
        });
        userId = user.id;

        // TODO: Enviar email com senha temporária
      }

      // Criar cliente
      const client = await Client.create({
        user_id: userId,
        created_by: req.user.id,
        name,
        email,
        phone,
        whatsapp: whatsapp || phone,
        cpf_cnpj,
        type: type || 'individual',
        address: address || {},
        notes,
        tags: tags || [],
        energyData: energyData || {},
        status: 'active',
        metadata: {
          source: 'manual',
          createdBy: req.user.name,
          firstContact: new Date()
        }
      });

      // Buscar cliente completo
      const completeClient = await Client.findByPk(client.id, {
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'creator', attributes: ['id', 'name'] }
        ]
      });

      logger.info(`Cliente criado: ${client.name} por ${req.user.email}`);

      res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso',
        data: completeClient
      });
    } catch (error) {
      logger.error('Erro ao criar cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao criar cliente'
      });
    }
  }

  /**
   * PUT /api/clients/:id
   * Atualiza cliente
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const client = await Client.findByPk(id);

      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado'
        });
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para editar este cliente'
        });
      }

      const {
        name,
        email,
        phone,
        whatsapp,
        cpf_cnpj,
        type,
        address,
        notes,
        tags,
        status,
        energyData
      } = req.body;

      // Verificar duplicados se email ou CPF/CNPJ mudaram
      if (email !== client.email || (cpf_cnpj && cpf_cnpj !== client.cpf_cnpj)) {
        const existingClient = await Client.findOne({
          where: {
            id: { [Op.ne]: id },
            [Op.or]: [
              { email: email || client.email },
              { cpf_cnpj: cpf_cnpj || client.cpf_cnpj }
            ]
          }
        });

        if (existingClient) {
          return res.status(400).json({
            success: false,
            error: 'Email ou CPF/CNPJ já cadastrado para outro cliente'
          });
        }
      }

      // Atualizar dados
      await client.update({
        name: name || client.name,
        email: email || client.email,
        phone: phone || client.phone,
        whatsapp: whatsapp || client.whatsapp,
        cpf_cnpj: cpf_cnpj || client.cpf_cnpj,
        type: type || client.type,
        address: address || client.address,
        notes: notes !== undefined ? notes : client.notes,
        tags: tags || client.tags,
        status: status || client.status,
        energyData: energyData || client.energyData
      });

      // Atualizar usuário vinculado se existir
      if (client.user_id) {
        const user = await User.findByPk(client.user_id);
        if (user) {
          await user.update({
            name: name || user.name,
            email: email || user.email,
            phone: phone || user.phone
          });
        }
      }

      logger.info(`Cliente atualizado: ${client.name} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Cliente atualizado com sucesso',
        data: client
      });
    } catch (error) {
      logger.error('Erro ao atualizar cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar cliente'
      });
    }
  }

  /**
   * DELETE /api/clients/:id
   * Remove cliente (soft delete)
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const client = await Client.findByPk(id, {
        include: [{
          model: Budget,
          as: 'budgets'
        }]
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado'
        });
      }

      // Verificar permissão
      if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para remover este cliente'
        });
      }

      // Verificar se tem orçamentos
      if (client.budgets && client.budgets.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Não é possível remover cliente com orçamentos. Desative o cliente em vez disso.'
        });
      }

      // Soft delete
      await client.destroy();

      logger.info(`Cliente removido: ${client.name} por ${req.user.email}`);

      res.json({
        success: true,
        message: 'Cliente removido com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao remover cliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao remover cliente'
      });
    }
  }

  /**
   * POST /api/clients/import
   * Importa clientes de arquivo CSV/Excel
   */
  async import(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo não enviado'
        });
      }

      // TODO: Implementar importação de CSV/Excel
      
      res.json({
        success: true,
        message: 'Funcionalidade em desenvolvimento'
      });
    } catch (error) {
      logger.error('Erro ao importar clientes:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao importar clientes'
      });
    }
  }

  /**
   * GET /api/clients/export
   * Exporta clientes para CSV/Excel
   */
  async export(req, res) {
    try {
      const { format = 'csv' } = req.query;

      const whereClause = {};
      if (req.user.role !== 'admin') {
        whereClause.created_by = req.user.id;
      }

      const clients = await Client.findAll({
        where: whereClause,
        attributes: [
          'name',
          'email',
          'phone',
          'cpf_cnpj',
          'type',
          'status',
          'createdAt'
        ],
        order: [['createdAt', 'DESC']]
      });

      if (format === 'csv') {
        // Gerar CSV
        let csv = 'Nome,Email,Telefone,CPF/CNPJ,Tipo,Status,Data Cadastro\n';
        
        clients.forEach(client => {
          csv += `"${client.name}","${client.email}","${client.phone}","${client.cpf_cnpj || ''}","${client.type}","${client.status}","${client.createdAt.toLocaleDateString('pt-BR')}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=clientes.csv');
        res.send(csv);
      } else {
        // TODO: Implementar exportação para Excel
        res.json({
          success: false,
          error: 'Formato não implementado'
        });
      }
    } catch (error) {
      logger.error('Erro ao exportar clientes:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao exportar clientes'
      });
    }
  }

  /**
   * GET /api/clients/stats
   * Estatísticas gerais de clientes
   */
  async stats(req, res) {
    try {
      const whereClause = {};
      if (req.user.role !== 'admin') {
        whereClause.created_by = req.user.id;
      }

      const [
        totalClients,
        activeClients,
        clientsWithBudgets,
        clientsWithAcceptedBudgets,
        newClientsThisMonth
      ] = await Promise.all([
        Client.count({ where: whereClause }),
        Client.count({ where: { ...whereClause, status: 'active' } }),
        Client.count({
          where: whereClause,
          include: [{
            model: Budget,
            as: 'budgets',
            required: true
          }],
          distinct: true
        }),
        Client.count({
          where: whereClause,
          include: [{
            model: Budget,
            as: 'budgets',
            where: { status: 'accepted' },
            required: true
          }],
          distinct: true
        }),
        Client.count({
          where: {
            ...whereClause,
            createdAt: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      const conversionRate = totalClients > 0 
        ? ((clientsWithAcceptedBudgets / totalClients) * 100).toFixed(1)
        : 0;

      res.json({
        success: true,
        data: {
          totalClients,
          activeClients,
          clientsWithBudgets,
          clientsWithAcceptedBudgets,
          newClientsThisMonth,
          conversionRate: parseFloat(conversionRate)
        }
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar estatísticas'
      });
    }
  }
}

module.exports = new ClientController();
