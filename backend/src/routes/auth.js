// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Middleware de validação
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

// Validações
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 3 }).withMessage('Nome deve ter no mínimo 3 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/\d/).withMessage('Senha deve conter pelo menos um número')
    .matches(/[A-Z]/).withMessage('Senha deve conter pelo menos uma letra maiúscula')
    .matches(/[a-z]/).withMessage('Senha deve conter pelo menos uma letra minúscula')
    .matches(/[!@#$%^&*]/).withMessage('Senha deve conter pelo menos um caractere especial'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/).withMessage('Formato de telefone inválido. Use: (XX) XXXXX-XXXX')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token é obrigatório'),
  body('password')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/\d/).withMessage('Senha deve conter pelo menos um número')
    .matches(/[A-Z]/).withMessage('Senha deve conter pelo menos uma letra maiúscula')
    .matches(/[a-z]/).withMessage('Senha deve conter pelo menos uma letra minúscula')
    .matches(/[!@#$%^&*]/).withMessage('Senha deve conter pelo menos um caractere especial')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
    .matches(/\d/).withMessage('Senha deve conter pelo menos um número')
    .matches(/[A-Z]/).withMessage('Senha deve conter pelo menos uma letra maiúscula')
    .matches(/[a-z]/).withMessage('Senha deve conter pelo menos uma letra minúscula')
    .matches(/[!@#$%^&*]/).withMessage('Senha deve conter pelo menos um caractere especial')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('Nova senha não pode ser igual à senha atual')
];

const profileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Nome deve ter no mínimo 3 caracteres'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/).withMessage('Formato de telefone inválido'),
  body('preferences')
    .optional()
    .isObject().withMessage('Preferências devem ser um objeto')
];

// Rotas públicas
router.post('/register', 
  registerValidation, 
  handleValidationErrors, 
  authController.register
);

router.post('/login', 
  loginValidation, 
  handleValidationErrors, 
  authController.login
);

router.post('/forgot-password', 
  forgotPasswordValidation, 
  handleValidationErrors, 
  authController.forgotPassword
);

router.post('/reset-password', 
  resetPasswordValidation, 
  handleValidationErrors, 
  authController.resetPassword
);

router.post('/refresh', authController.refresh);

// Rotas autenticadas
router.use(authenticate); // Todas as rotas abaixo requerem autenticação

router.post('/logout', authController.logout);

router.get('/me', authController.me);

router.put('/profile', 
  profileValidation, 
  handleValidationErrors, 
  authController.updateProfile
);

router.put('/change-password', 
  changePasswordValidation, 
  handleValidationErrors, 
  authController.changePassword
);

// Rota de verificação de saúde
router.get('/verify', (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user
  });
});

module.exports = router;
