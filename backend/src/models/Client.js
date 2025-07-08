// src/models/Client.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cpf_cnpj: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('individual', 'company'),
      defaultValue: 'individual'
    },
    address: {
      type: DataTypes.JSONB,
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'prospect'),
      defaultValue: 'prospect'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        source: 'manual', // manual, website, whatsapp, referral
        referralBy: null,
        firstContact: new Date()
      }
    },
    // Energy consumption data for solar calculations
    energyData: {
      type: DataTypes.JSONB,
      defaultValue: {
        monthlyConsumption: 0, // kWh
        monthlyBill: 0, // R$
        tariff: 0.86, // R$/kWh (Manaus default)
        concessionaria: 'Amazonas Energia'
      }
    }
  }, {
    tableName: 'clients',
    timestamps: true,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['cpf_cnpj']
      },
      {
        fields: ['phone']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance methods
  Client.prototype.getFullAddress = function() {
    const addr = this.address;
    return `${addr.street}, ${addr.number}${addr.complement ? ' - ' + addr.complement : ''}, ${addr.neighborhood}, ${addr.city}/${addr.state} - CEP: ${addr.zipCode}`;
  };

  Client.prototype.isCompany = function() {
    return this.type === 'company';
  };

  return Client;
};
