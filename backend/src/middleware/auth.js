// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware de autenticação JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Conta desativada'
      });
    }

    // Adicionar usuário à requisição
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    logger.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao autenticar'
    });
  }
};

/**
 * Middleware de autorização por role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Acesso negado: usuário ${req.user.email} tentou acessar recurso restrito`);
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticação (não bloqueia se não autenticado)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
    }
  } catch (error) {
    // Ignora erros - é autenticação opcional
  }

  next();
};

/**
 * Middleware para verificar propriedade de recurso
 */
const checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Recurso não encontrado'
        });
      }

      // Admin pode acessar tudo
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Verificar propriedade
      const ownerField = resource.user_id || resource.created_by;
      if (ownerField !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar este recurso'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Erro ao verificar propriedade:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Gerar token JWT
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRATION || '7d'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

/**
 * Gerar refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  const options = {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership,
  generateToken,
  generateRefreshToken
};
