// src/models/Budget.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Budget = sequelize.define('Budget', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clients',
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
    budgetNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('solar', 'service'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
      defaultValue: 'draft'
    },
    // Solar specific data
    solarData: {
      type: DataTypes.JSONB,
      defaultValue: null,
      validate: {
        isValidForType(value) {
          if (this.type === 'solar' && !value) {
            throw new Error('Solar data is required for solar budgets');
          }
        }
      }
    },
    // Service specific data
    serviceData: {
      type: DataTypes.JSONB,
      defaultValue: null,
      validate: {
        isValidForType(value) {
          if (this.type === 'service' && !value) {
            throw new Error('Service data is required for service budgets');
          }
        }
      }
    },
    // Financial summary
    financial: {
      type: DataTypes.JSONB,
      defaultValue: {
        subtotal: 0,
        discount: 0,
        discountType: 'percentage', // percentage or fixed
        tax: 0,
        total: 0,
        paymentConditions: {
          cash: { discount: 10 },
          installments: { max: 18, interest: 0 },
          financing: { available: true }
        }
      }
    },
    // Additional settings
    settings: {
      type: DataTypes.JSONB,
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
      type: DataTypes.TEXT,
      allowNull: true
    },
    observations: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    parentBudgetId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'budgets',
        key: 'id'
      }
    }
  }, {
    tableName: 'budgets',
    timestamps: true,
    hooks: {
      beforeCreate: async (budget) => {
        // Generate budget number
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await Budget.count({
          where: sequelize.where(
            sequelize.fn('date_part', 'year', sequelize.col('createdAt')),
            year
          )
        });
        budget.budgetNumber = `ORC-${year}${month}-${String(count + 1).padStart(4, '0')}`;
        
        // Set validity date
        if (!budget.validUntil) {
          const validityDays = budget.settings?.validityDays || 15;
          budget.validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
        }
      }
    },
    indexes: [
      {
        fields: ['budgetNumber']
      },
      {
        fields: ['client_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Solar data structure example:
  Budget.SOLAR_DATA_STRUCTURE = {
    system: {
      desiredPower: 0, // kW
      panelPower: 610, // W
      magicNumber: 107,
      panelQuantity: 0,
      systemPower: 0, // kWp
      inverter: {
        nominal: 0, // kW
        maximum: 0, // kWp
        model: ''
      }
    },
    calculations: {
      kitValue: 0,
      materialValue: 0,
      laborValue: 0,
      laborPerKwp: 350,
      tax: 0,
      profitMargin: 25, // %
      commission: 0,
      commissionPercentage: 5
    },
    production: {
      monthlyAverage: 0, // kWh
      yearlyTotal: 0, // kWh
      tariff: 0.86, // R$/kWh
      monthlyEconomy: 0, // R$
      yearlyEconomy: 0, // R$
      projectionYears: 25
    }
  };

  // Instance methods
  Budget.prototype.isExpired = function() {
    return new Date() > this.validUntil;
  };

  Budget.prototype.calculateTotal = function() {
    const financial = this.financial;
    let total = financial.subtotal;
    
    if (financial.discount > 0) {
      if (financial.discountType === 'percentage') {
        total -= (total * financial.discount / 100);
      } else {
        total -= financial.discount;
      }
    }
    
    total += financial.tax;
    return total;
  };

  return Budget;
};
