// src/models/BudgetItem.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BudgetItem = sequelize.define('BudgetItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    budget_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'budgets',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('product', 'service', 'material', 'labor'),
      defaultValue: 'product'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1
    },
    unit: {
      type: DataTypes.STRING,
      defaultValue: 'un'
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Custo do item para cálculo de margem'
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'Desconto em percentual'
    },
    tax: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'Imposto em percentual'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        brand: null,
        model: null,
        warranty: null,
        supplier: null,
        partNumber: null
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isOptional: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isIncluded: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'budget_items',
    timestamps: true,
    hooks: {
      beforeSave: (item) => {
        // Calcular preço total
        const basePrice = item.quantity * item.unit_price;
        const discountAmount = basePrice * (item.discount / 100);
        const priceAfterDiscount = basePrice - discountAmount;
        const taxAmount = priceAfterDiscount * (item.tax / 100);
        item.total_price = priceAfterDiscount + taxAmount;
      }
    },
    indexes: [
      {
        fields: ['budget_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['category']
      }
    ]
  });

  // Instance methods
  BudgetItem.prototype.getMargin = function() {
    if (!this.cost) return null;
    return ((this.unit_price - this.cost) / this.unit_price) * 100;
  };

  BudgetItem.prototype.getProfitAmount = function() {
    if (!this.cost) return null;
    return (this.unit_price - this.cost) * this.quantity;
  };

  return BudgetItem;
};
