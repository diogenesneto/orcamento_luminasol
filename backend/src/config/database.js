// src/config/database.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Database connection configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'luminasol',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  logging: process.env.NODE_ENV === 'development' ? 
    (msg) => logger.debug(msg) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Import models
const User = require('../models/User')(sequelize);
const Client = require('../models/Client')(sequelize);
const Budget = require('../models/Budget')(sequelize);
const Proposal = require('../models/Proposal')(sequelize);
const SystemConfig = require('../models/SystemConfig')(sequelize);
const BudgetItem = require('../models/BudgetItem')(sequelize);
const ProposalView = require('../models/ProposalView')(sequelize);
const Notification = require('../models/Notification')(sequelize);

// Define associations
// User associations
User.hasMany(Client, { foreignKey: 'created_by', as: 'createdClients' });
User.hasMany(Budget, { foreignKey: 'created_by', as: 'createdBudgets' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

// Client associations
Client.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Client.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Client.hasMany(Budget, { foreignKey: 'client_id', as: 'budgets' });

// Budget associations
Budget.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Budget.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Budget.hasMany(BudgetItem, { foreignKey: 'budget_id', as: 'items' });
Budget.hasOne(Proposal, { foreignKey: 'budget_id', as: 'proposal' });

// Budget Item associations
BudgetItem.belongsTo(Budget, { foreignKey: 'budget_id', as: 'budget' });

// Proposal associations
Proposal.belongsTo(Budget, { foreignKey: 'budget_id', as: 'budget' });
Proposal.hasMany(ProposalView, { foreignKey: 'proposal_id', as: 'views' });

// Proposal View associations
ProposalView.belongsTo(Proposal, { foreignKey: 'proposal_id', as: 'proposal' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Client,
  Budget,
  BudgetItem,
  Proposal,
  ProposalView,
  SystemConfig,
  Notification
};
