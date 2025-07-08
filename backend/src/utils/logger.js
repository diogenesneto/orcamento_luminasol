// src/utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Garantir que o diretório de logs existe
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato customizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Adicionar metadados se existirem
    if (Object.keys(metadata).length > 0) {
      // Remover stack trace dos metadados para log mais limpo
      const { stack, ...cleanMetadata } = metadata;
      if (Object.keys(cleanMetadata).length > 0) {
        msg += ` ${JSON.stringify(cleanMetadata)}`;
      }
      if (stack) {
        msg += `\n${stack}`;
      }
    }
    
    return msg;
  })
);

// Configuração de transportes
const transports = [
  // Console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0 && metadata.stack) {
          msg += `\n${metadata.stack}`;
        }
        return msg;
      })
    )
  })
];

// Adicionar transporte de arquivo apenas em produção
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Arquivo para todos os logs
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Arquivo separado para erros
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false
});

// Adicionar stream para Morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Funções auxiliares para logging estruturado
logger.logRequest = (req, message, metadata = {}) => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    ...metadata
  });
};

logger.logError = (error, message, metadata = {}) => {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...metadata
  });
};

logger.logDatabase = (operation, model, metadata = {}) => {
  logger.debug(`Database ${operation}: ${model}`, metadata);
};

logger.logEmail = (to, subject, status, metadata = {}) => {
  logger.info('Email sent', {
    to,
    subject,
    status,
    ...metadata
  });
};

logger.logAuth = (event, email, success, metadata = {}) => {
  const level = success ? 'info' : 'warn';
  logger[level](`Auth ${event}: ${email}`, {
    success,
    ...metadata
  });
};

// Capturar exceções não tratadas
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
});

module.exports = logger;
