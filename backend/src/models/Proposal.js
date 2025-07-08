// src/models/Proposal.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Proposal = sequelize.define('Proposal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    budget_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'budgets',
        key: 'id'
      }
    },
    proposalNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    unique_link: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
      defaultValue: 'draft'
    },
    documents: {
      type: DataTypes.JSONB,
      defaultValue: {
        word: null,
        pdf: null,
        excel: null
      }
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    firstViewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastViewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clientSignature: {
      type: DataTypes.TEXT, // Base64 da assinatura
      allowNull: true
    },
    acceptanceData: {
      type: DataTypes.JSONB,
      defaultValue: {
        ip: null,
        userAgent: null,
        location: null,
        device: null
      }
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    emailsSent: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      defaultValue: []
    },
    customizations: {
      type: DataTypes.JSONB,
      defaultValue: {
        showPrices: true,
        showPaymentOptions: true,
        showTechnicalDetails: true,
        showEconomyProjection: true,
        customMessage: null,
        theme: 'default'
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'proposals',
    timestamps: true,
    hooks: {
      beforeCreate: async (proposal) => {
        // Gerar número da proposta
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await Proposal.count({
          where: sequelize.where(
            sequelize.fn('date_part', 'year', sequelize.col('createdAt')),
            year
          )
        });
        proposal.proposalNumber = `PROP-${year}${month}-${String(count + 1).padStart(4, '0')}`;
        
        // Gerar link único
        const crypto = require('crypto');
        proposal.unique_link = crypto.randomBytes(32).toString('hex');
      }
    },
    indexes: [
      {
        fields: ['unique_link']
      },
      {
        fields: ['status']
      },
      {
        fields: ['budget_id']
      }
    ]
  });

  // Instance methods
  Proposal.prototype.markAsViewed = async function(viewData = {}) {
    if (!this.firstViewedAt) {
      this.firstViewedAt = new Date();
      this.status = 'viewed';
    }
    this.lastViewedAt = new Date();
    this.viewCount += 1;
    
    // Registrar visualização
    await this.createView(viewData);
    
    return this.save();
  };

  Proposal.prototype.accept = async function(acceptanceData = {}) {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    this.acceptanceData = {
      ...this.acceptanceData,
      ...acceptanceData,
      timestamp: new Date()
    };
    
    // Atualizar status do orçamento
    const budget = await this.getBudget();
    budget.status = 'accepted';
    await budget.save();
    
    return this.save();
  };

  Proposal.prototype.reject = async function(reason) {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    
    // Atualizar status do orçamento
    const budget = await this.getBudget();
    budget.status = 'rejected';
    await budget.save();
    
    return this.save();
  };

  Proposal.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  };

  Proposal.prototype.getPublicUrl = function() {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/proposal/${this.unique_link}`;
  };

  return Proposal;
};
