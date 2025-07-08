// src/seeders/001-create-admin-user.js
'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Administrador',
        email: 'admin@luminasol.com.br',
        password: hashedPassword,
        phone: '(92) 98829-9040',
        role: 'admin',
        isActive: true,
        preferences: JSON.stringify({
          notifications: {
            email: true,
            whatsapp: true
          },
          theme: 'light',
          language: 'pt-BR'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create demo user
    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Vendedor Demo',
        email: 'vendedor@luminasol.com.br',
        password: hashedPassword,
        phone: '(92) 99999-0000',
        role: 'user',
        isActive: true,
        preferences: JSON.stringify({
          notifications: {
            email: true,
            whatsapp: true
          },
          theme: 'light',
          language: 'pt-BR'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@luminasol.com.br', 'vendedor@luminasol.com.br']
      }
    });
  }
};

// src/seeders/002-create-demo-clients.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get admin user id
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@luminasol.com.br' LIMIT 1"
    );
    
    if (users.length === 0) {
      throw new Error('Admin user not found');
    }
    
    const adminId = users[0].id;

    // Create demo clients
    await queryInterface.bulkInsert('clients', [
      {
        id: uuidv4(),
        created_by: adminId,
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(92) 98765-4321',
        whatsapp: '(92) 98765-4321',
        cpf_cnpj: '123.456.789-01',
        type: 'individual',
        address: JSON.stringify({
          street: 'Av. Djalma Batista',
          number: '123',
          complement: 'Apto 45',
          neighborhood: 'Chapada',
          city: 'Manaus',
          state: 'AM',
          zipCode: '69050-010'
        }),
        notes: 'Cliente interessado em sistema solar residencial',
        status: 'active',
        tags: JSON.stringify(['residencial', 'alto-padrão']),
        metadata: JSON.stringify({
          source: 'website',
          firstContact: new Date()
        }),
        energyData: JSON.stringify({
          monthlyConsumption: 450,
          monthlyBill: 387,
          tariff: 0.86,
          concessionaria: 'Amazonas Energia'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        created_by: adminId,
        name: 'Maria Santos',
        email: 'maria.santos@empresa.com.br',
        phone: '(92) 99876-5432',
        whatsapp: '(92) 99876-5432',
        cpf_cnpj: '12.345.678/0001-90',
        type: 'company',
        address: JSON.stringify({
          street: 'Rua das Flores',
          number: '456',
          complement: 'Sala 101',
          neighborhood: 'Centro',
          city: 'Manaus',
          state: 'AM',
          zipCode: '69010-100'
        }),
        notes: 'Empresa de médio porte interessada em reduzir custos',
        status: 'active',
        tags: JSON.stringify(['comercial', 'industria']),
        metadata: JSON.stringify({
          source: 'indicação',
          referralBy: 'João Silva',
          firstContact: new Date()
        }),
        energyData: JSON.stringify({
          monthlyConsumption: 2500,
          monthlyBill: 2150,
          tariff: 0.86,
          concessionaria: 'Amazonas Energia'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        created_by: adminId,
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@gmail.com',
        phone: '(92) 98765-1234',
        whatsapp: '(92) 98765-1234',
        cpf_cnpj: '987.654.321-02',
        type: 'individual',
        address: JSON.stringify({
          street: 'Av. Constantino Nery',
          number: '789',
          complement: '',
          neighborhood: 'Flores',
          city: 'Manaus',
          state: 'AM',
          zipCode: '69058-000'
        }),
        notes: 'Interessado em sistema solar para casa de veraneio',
        status: 'prospect',
        tags: JSON.stringify(['residencial', 'veraneio']),
        metadata: JSON.stringify({
          source: 'whatsapp',
          firstContact: new Date()
        }),
        energyData: JSON.stringify({
          monthlyConsumption: 300,
          monthlyBill: 258,
          tariff: 0.86,
          concessionaria: 'Amazonas Energia'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('clients', {
      email: {
        [Sequelize.Op.in]: [
          'joao.silva@email.com',
          'maria.santos@empresa.com.br',
          'pedro.oliveira@gmail.com'
        ]
      }
    });
  }
};

// src/seeders/003-create-system-configs.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('system_configs', [
      {
        id: uuidv4(),
        key: 'company.name',
        value: JSON.stringify('LuminaSol Energia Solar'),
        type: 'string',
        category: 'company',
        description: 'Nome da empresa',
        isPublic: true,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        key: 'company.phone',
        value: JSON.stringify('(92) 98829-9040'),
        type: 'string',
        category: 'company',
        description: 'Telefone principal',
        isPublic: true,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        key: 'company.email',
        value: JSON.stringify('contato@luminasol.com.br'),
        type: 'string',
        category: 'company',
        description: 'Email de contato',
        isPublic: true,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        key: 'solar.default_kwh_value',
        value: JSON.stringify(0.86),
        type: 'number',
        category: 'solar',
        description: 'Valor padrão do kWh em Manaus',
        isPublic: false,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        key: 'solar.default_magic_number',
        value: JSON.stringify(107),
        type: 'number',
        category: 'solar',
        description: 'Número mágico padrão para cálculos',
        isPublic: false,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        key: 'solar.seasonal_factors',
        value: JSON.stringify([0.914, 0.93, 0.935, 0.886, 0.898, 1.016, 1.025, 1.141, 1.131, 1.101, 1.071, 0.953]),
        type: 'array',
        category: 'solar',
        description: 'Fatores sazonais de produção para Manaus',
        isPublic: false,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('system_configs', {
      category: {
        [Sequelize.Op.in]: ['company', 'solar']
      }
    });
  }
};
