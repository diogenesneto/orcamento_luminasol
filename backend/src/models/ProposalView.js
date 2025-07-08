const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProposalView = sequelize.define('ProposalView', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    proposal_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'proposals',
        key: 'id'
      }
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    device: {
      type: DataTypes.JSONB,
      defaultValue: {
        type: null, // mobile, tablet, desktop
        os: null,
        browser: null,
        version: null
      }
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {
        country: null,
        region: null,
        city: null,
        lat: null,
        lon: null
      }
    },
    referrer: {
      type: DataTypes.STRING,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tempo de visualização em segundos'
    },
    actions: {
      type: DataTypes.JSONB,
      defaultValue: {
        downloads: [],
        clicks: [],
        scrollDepth: 0
      }
    }
  }, {
    tableName: 'proposal_views',
    timestamps: true,
    indexes: [
      {
        fields: ['proposal_id']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return ProposalView;
};
