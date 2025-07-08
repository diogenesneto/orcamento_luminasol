// migrations/003-create-budgets.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('budgets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      budgetNumber: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('solar', 'service'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
        defaultValue: 'draft'
      },
      solarData: {
        type: Sequelize.JSONB,
        defaultValue: null
      },
      serviceData: {
        type: Sequelize.JSONB,
        defaultValue: null
      },
      financial: {
        type: Sequelize.JSONB,
        defaultValue: {
          subtotal: 0,
          discount: 0,
          discountType: 'percentage',
          tax: 0,
          total: 0,
          paymentConditions: {
            cash: { discount: 10 },
            installments: { max: 18, interest: 0 },
            financing: { available: true }
          }
        }
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {
          includeInstallation: true,
          includeHomologation: true,
          warrantyYears: 1,
          validityDays: 15,
          showEconomyProjection: true,
          showFinancingOptions: true
        }
      },
      materials: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      observations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      validUntil: {
        type: Sequelize.DATE,
        allowNull: false
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      parentBudgetId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'budgets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('budgets', ['budgetNumber'], { unique: true });
    await queryInterface.addIndex('budgets', ['client_id']);
    await queryInterface.addIndex('budgets', ['created_by']);
    await queryInterface.addIndex('budgets', ['status']);
    await queryInterface.addIndex('budgets', ['type']);
    await queryInterface.addIndex('budgets', ['createdAt']);
    await queryInterface.addIndex('budgets', ['validUntil']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('budgets');
  }
};
