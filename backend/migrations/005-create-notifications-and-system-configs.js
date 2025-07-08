// migrations/005-create-notifications-and-system-configs.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM(
          'budget_created',
          'budget_sent',
          'proposal_viewed',
          'proposal_accepted',
          'proposal_rejected',
          'proposal_expiring',
          'client_created',
          'system_update',
          'custom'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true
      },
      link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      channels: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: ['app']
      },
      sentChannels: {
        type: Sequelize.JSONB,
        defaultValue: {}
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

    // Create system_configs table
    await queryInterface.createTable('system_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json', 'array'),
        defaultValue: 'string'
      },
      category: {
        type: Sequelize.STRING,
        defaultValue: 'general'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isEditable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      validation: {
        type: Sequelize.JSONB,
        defaultValue: null
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

    // Add indexes for notifications
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('notifications', ['createdAt']);
    await queryInterface.addIndex('notifications', ['priority']);

    // Add indexes for system_configs
    await queryInterface.addIndex('system_configs', ['key'], { unique: true });
    await queryInterface.addIndex('system_configs', ['category']);
    await queryInterface.addIndex('system_configs', ['isPublic']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('system_configs');
  }
};
