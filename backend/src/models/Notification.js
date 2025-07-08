const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Dados adicionais relacionados à notificação'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Link para ação relacionada'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    channels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['app'],
      comment: 'Canais de notificação: app, email, whatsapp, push'
    },
    sentChannels: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Status de envio por canal'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['isRead']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Instance methods
  Notification.prototype.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  };

  // Class methods
  Notification.createForUser = async function(userId, notificationData) {
    const notification = await this.create({
      user_id: userId,
      ...notificationData
    });

    // Enviar para canais configurados
    if (notification.channels.includes('email')) {
      // TODO: Enviar email
    }
    
    if (notification.channels.includes('whatsapp')) {
      // TODO: Enviar WhatsApp
    }

    if (notification.channels.includes('push')) {
      // TODO: Enviar push notification
    }

    return notification;
  };

  Notification.createBulk = async function(userIds, notificationData) {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      ...notificationData
    }));

    return this.bulkCreate(notifications);
  };

  return Notification;
};
