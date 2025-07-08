// migrations/004-create-proposals.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create proposals table
    await queryInterface.createTable('proposals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      budget_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'budgets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      proposalNumber: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      unique_link: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
        defaultValue: 'draft'
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: {
          word: null,
          pdf: null,
          excel: null
        }
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      firstViewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastViewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      acceptedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      clientSignature: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      acceptanceData: {
        type: Sequelize.JSONB,
        defaultValue: {
          ip: null,
          userAgent: null,
          location: null,
          device: null
        }
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      downloadCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      shareCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      emailsSent: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: []
      },
      customizations: {
        type: Sequelize.JSONB,
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
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create proposal_views table
    await queryInterface.createTable('proposal_views', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      proposal_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'proposals',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      device: {
        type: Sequelize.JSONB,
        defaultValue: {
          type: null,
          os: null,
          browser: null,
          version: null
        }
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {
          country: null,
          region: null,
          city: null,
          lat: null,
          lon: null
        }
      },
      referrer: {
        type: Sequelize.STRING,
        allowNull: true
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      actions: {
        type: Sequelize.JSONB,
        defaultValue: {
          downloads: [],
          clicks: [],
          scrollDepth: 0
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create budget_items table
    await queryInterface.createTable('budget_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      budget_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'budgets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('product', 'service', 'material', 'labor'),
        defaultValue: 'product'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1
      },
      unit: {
        type: Sequelize.STRING,
        defaultValue: 'un'
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      discount: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      tax: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {
          brand: null,
          model: null,
          warranty: null,
          supplier: null,
          partNumber: null
        }
      },
      order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isOptional: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isIncluded: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for proposals
    await queryInterface.addIndex('proposals', ['unique_link'], { unique: true });
    await queryInterface.addIndex('proposals', ['status']);
    await queryInterface.addIndex('proposals', ['budget_id'], { unique: true });

    // Add indexes for proposal_views
    await queryInterface.addIndex('proposal_views', ['proposal_id']);
    await queryInterface.addIndex('proposal_views', ['createdAt']);

    // Add indexes for budget_items
    await queryInterface.addIndex('budget_items', ['budget_id']);
    await queryInterface.addIndex('budget_items', ['type']);
    await queryInterface.addIndex('budget_items', ['category']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('budget_items');
    await queryInterface.dropTable('proposal_views');
    await queryInterface.dropTable('proposals');
  }
};
