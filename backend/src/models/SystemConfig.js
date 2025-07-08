const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemConfig = sequelize.define('SystemConfig', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
      defaultValue: 'string'
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: 'general'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Se pode ser acessado sem autenticação'
    },
    isEditable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se pode ser editado pelo admin'
    },
    validation: {
      type: DataTypes.JSONB,
      defaultValue: null,
      comment: 'Regras de validação para o valor'
    }
  }, {
    tableName: 'system_configs',
    timestamps: true,
    indexes: [
      {
        fields: ['key'],
        unique: true
      },
      {
        fields: ['category']
      }
    ]
  });

  // Configurações padrão do sistema
  SystemConfig.DEFAULT_CONFIGS = [
    {
      key: 'company.name',
      value: 'LuminaSol Energia Solar',
      type: 'string',
      category: 'company',
      description: 'Nome da empresa'
    },
    {
      key: 'company.phone',
      value: '(92) 98829-9040',
      type: 'string',
      category: 'company',
      description: 'Telefone principal'
    },
    {
      key: 'company.email',
      value: 'contato@luminasol.com.br',
      type: 'string',
      category: 'company',
      description: 'Email de contato'
    },
    {
      key: 'company.address',
      value: {
        street: 'Av. Djalma Batista',
        number: '1661',
        complement: 'Millennium Center, Torre Business, Sala 1009',
        neighborhood: 'Chapada',
        city: 'Manaus',
        state: 'AM',
        zipCode: '69050-010'
      },
      type: 'json',
      category: 'company',
      description: 'Endereço da empresa'
    },
    {
      key: 'solar.default_kwh_value',
      value: 0.86,
      type: 'number',
      category: 'solar',
      description: 'Valor padrão do kWh em Manaus'
    },
    {
      key: 'solar.default_magic_number',
      value: 107,
      type: 'number',
      category: 'solar',
      description: 'Número mágico padrão para cálculos'
    },
    {
      key: 'solar.default_panel_power',
      value: 610,
      type: 'number',
      category: 'solar',
      description: 'Potência padrão dos painéis em Watts'
    },
    {
      key: 'solar.default_labor_per_kwp',
      value: 350,
      type: 'number',
      category: 'solar',
      description: 'Valor padrão de mão de obra por kWp'
    },
    {
      key: 'solar.seasonal_factors',
      value: [0.914, 0.93, 0.935, 0.886, 0.898, 1.016, 1.025, 1.141, 1.131, 1.101, 1.071, 0.953],
      type: 'array',
      category: 'solar',
      description: 'Fatores sazonais de produção para Manaus'
    },
    {
      key: 'solar.base_production',
      value: 107.88,
      type: 'number',
      category: 'solar',
      description: 'Produção base em kWh/kWp/mês para Manaus'
    },
    {
      key: 'budget.validity_days',
      value: 15,
      type: 'number',
      category: 'budget',
      description: 'Dias de validade padrão para orçamentos'
    },
    {
      key: 'budget.cash_discount',
      value: 10,
      type: 'number',
      category: 'budget',
      description: 'Desconto padrão para pagamento à vista (%)'
    },
    {
      key: 'budget.max_installments',
      value: 18,
      type: 'number',
      category: 'budget',
      description: 'Número máximo de parcelas sem juros'
    },
    {
      key: 'email.templates.proposal',
      value: {
        subject: 'Sua Proposta de Energia Solar - LuminaSol',
        template: 'proposal-default'
      },
      type: 'json',
      category: 'email',
      description: 'Template de email para envio de propostas'
    },
    {
      key: 'features.whatsapp_integration',
      value: true,
      type: 'boolean',
      category: 'features',
      description: 'Habilitar integração com WhatsApp'
    },
    {
      key: 'features.online_payment',
      value: false,
      type: 'boolean',
      category: 'features',
      description: 'Habilitar pagamento online'
    },
    {
      key: 'features.client_portal',
      value: true,
      type: 'boolean',
      category: 'features',
      description: 'Habilitar portal do cliente'
    }
  ];

  // Class methods
  SystemConfig.get = async function(key, defaultValue = null) {
    const config = await this.findOne({ where: { key } });
    return config ? config.value : defaultValue;
  };

  SystemConfig.set = async function(key, value, options = {}) {
    const [config, created] = await this.findOrCreate({
      where: { key },
      defaults: {
        value,
        ...options
      }
    });

    if (!created) {
      config.value = value;
      await config.save();
    }

    return config;
  };

  SystemConfig.getByCategory = async function(category) {
    const configs = await this.findAll({ where: { category } });
    return configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {});
  };

  return SystemConfig;
};
