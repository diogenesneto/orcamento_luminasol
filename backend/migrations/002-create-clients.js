// migrations/002-create-clients.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      whatsapp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cpf_cnpj: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      type: {
        type: Sequelize.ENUM('individual', 'company'),
        defaultValue: 'individual'
      },
      address: {
        type: Sequelize.JSONB,
        defaultValue: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: 'Manaus',
          state: 'AM',
          zipCode: ''
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'prospect'),
        defaultValue: 'prospect'
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {
          source: 'manual',
          referralBy: null,
          firstContact: new Date()
        }
      },
      energyData: {
        type: Sequelize.JSONB,
        defaultValue: {
          monthlyConsumption: 0,
          monthlyBill: 0,
          tariff: 0.86,
          concessionaria: 'Amazonas Energia'
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
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('clients', ['email']);
    await queryInterface.addIndex('clients', ['cpf_cnpj'], { unique: true, where: { cpf_cnpj: { [Sequelize.Op.ne]: null } } });
    await queryInterface.addIndex('clients', ['phone']);
    await queryInterface.addIndex('clients', ['status']);
    await queryInterface.addIndex('clients', ['created_by']);
    await queryInterface.addIndex('clients', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('clients');
  }
};
