const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const clientController = require('../controllers/clientController');
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/imports'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `import-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo não suportado. Use CSV ou Excel.'));
    }
  }
});

// Validações
const createValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 3 }).withMessage('Nome deve ter no mínimo 3 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty().withMessage('Telefone é obrigatório')
    .matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/).withMessage('Formato inválido. Use: (XX) XXXXX-XXXX'),
  body('cpf_cnpj')
    .optional()
    .trim()
    .custom((value) => {
      // Validação básica de CPF/CNPJ
      const numbers = value.replace(/\D/g, '');
      return numbers.length === 11 || numbers.length === 14;
    }).withMessage('CPF/CNPJ inválido'),
  body('type')
    .optional()
    .isIn(['individual', 'company']).withMessage('Tipo deve ser individual ou company'),
  body('address')
    .optional()
    .isObject().withMessage('Endereço deve ser um objeto'),
  body('address.zipCode')
    .optional()
    .matches(/^\d{5}-?\d{3}$/).withMessage('CEP inválido'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags deve ser um array'),
  body('energyData.monthlyConsumption')
    .optional()
    .isFloat({ min: 0 }).withMessage('Consumo mensal deve ser um número positivo'),
  body('energyData.monthlyBill')
    .optional()
    .isFloat({ min: 0 }).withMessage('Conta mensal deve ser um número positivo')
];

const updateValidation = [
  param('id').isUUID().withMessage('ID inválido'),
  ...createValidation.map(validation => validation.optional())
];

// Middleware para tratar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Todas as rotas requerem autenticação
router.use(authenticate);

// GET /api/clients - Listar clientes
router.get('/', clientController.index);

// GET /api/clients/stats - Estatísticas
router.get('/stats', clientController.stats);

// GET /api/clients/export - Exportar clientes
router.get('/export', clientController.export);

// GET /api/clients/:id - Buscar cliente
router.get('/:id', 
  param('id').isUUID().withMessage('ID inválido'),
  handleValidationErrors,
  clientController.show
);

// POST /api/clients - Criar cliente
router.post('/', 
  createValidation,
  handleValidationErrors,
  clientController.create
);

// PUT /api/clients/:id - Atualizar cliente
router.put('/:id',
  updateValidation,
  handleValidationErrors,
  clientController.update
);

// DELETE /api/clients/:id - Remover cliente
router.delete('/:id',
  param('id').isUUID().withMessage('ID inválido'),
  handleValidationErrors,
  authorize('admin'), // Apenas admin pode deletar
  clientController.destroy
);

// POST /api/clients/import - Importar clientes
router.post('/import',
  authorize('admin'),
  upload.single('file'),
  clientController.import
);

module.exports = router;
