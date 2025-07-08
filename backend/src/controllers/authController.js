// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Client } = require('../config/database');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * POST /api/auth/register
   * Registrar novo usuário
   */
  async register(req, res) {
    try {
      // Validação
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const { name, email, password, phone, role = 'user' } = req.body;

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email já cadastrado'
        });
      }

      // Criar usuário
      const user = await User.create({
        name,
        email,
        password, // Hash é feito no hook beforeCreate
        phone,
        role: role === 'admin' && req.user?.role === 'admin' ? 'admin' : 'user'
      });

      // Se for cliente, criar registro de cliente também
      if (req.body.createClient) {
        await Client.create({
          user_id: user.id,
          created_by: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: 'active'
        });
      }

      // Gerar tokens
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Enviar email de boas-vindas
      await emailService.sendWelcome(user.email, {
        name: user.name
      }).catch(err => {
        logger.error('Erro ao enviar email de boas-vindas:', err);
      });

      logger.info(`Novo usuário registrado: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Erro ao registrar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao registrar usuário'
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login de usuário
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuário
      const user = await User.findOne({ 
        where: { email },
        include: [{
          model: Client,
          as: 'createdClients',
          required: false
        }]
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Email ou senha inválidos'
        });
      }

      // Verificar senha
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Email ou senha inválidos'
        });
      }

      // Verificar se está ativo
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Conta desativada. Entre em contato com o suporte.'
        });
      }

      // Atualizar último login
      user.lastLogin = new Date();
      await user.save();

      // Gerar tokens
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info(`Login bem-sucedido: ${user.email}`);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao realizar login'
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout de usuário
   */
  async logout(req, res) {
    try {
      // TODO: Implementar blacklist de tokens se necessário
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao realizar logout'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Renovar token de acesso
   */
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token não fornecido'
        });
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          error: 'Token inválido'
        });
      }

      // Buscar usuário
      const user = await User.findByPk(decoded.id);
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não encontrado ou inativo'
        });
      }

      // Gerar novo access token
      const newAccessToken = generateToken(user);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token expirado'
        });
      }

      logger.error('Erro ao renovar token:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao renovar token'
      });
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Solicitar reset de senha
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Não revelar se o email existe
        return res.json({
          success: true,
          message: 'Se o email existir, você receberá instruções para redefinir sua senha'
        });
      }

      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

      user.resetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Enviar email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      await emailService.sendPasswordReset(user.email, {
        name: user.name,
        resetUrl
      });

      logger.info(`Reset de senha solicitado para: ${user.email}`);

      res.json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });
    } catch (error) {
      logger.error('Erro ao solicitar reset de senha:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao processar solicitação'
      });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Resetar senha com token
   */
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      // Hash do token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Buscar usuário com token válido
      const user = await User.findOne({
        where: {
          resetToken: hashedToken,
          resetTokenExpiry: { [Op.gt]: new Date() }
        }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Token inválido ou expirado'
        });
      }

      // Atualizar senha
      user.password = password; // Hash é feito no hook
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      // Enviar confirmação por email
      await emailService.sendPasswordChanged(user.email, {
        name: user.name
      });

      logger.info(`Senha resetada para: ${user.email}`);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao resetar senha:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao resetar senha'
      });
    }
  }

  /**
   * GET /api/auth/me
   * Obter dados do usuário autenticado
   */
  async me(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
        include: [{
          model: Client,
          as: 'createdClients',
          required: false
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados do usuário'
      });
    }
  }

  /**
   * PUT /api/auth/profile
   * Atualizar perfil do usuário
   */
  async updateProfile(req, res) {
    try {
      const { name, phone, preferences } = req.body;
      
      const user = await User.findByPk(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      // Atualizar dados
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (preferences) user.preferences = { ...user.preferences, ...preferences };
      
      await user.save();

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: user.toJSON()
      });
    } catch (error) {
      logger.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao atualizar perfil'
      });
    }
  }

  /**
   * PUT /api/auth/change-password
   * Alterar senha do usuário autenticado
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await User.findByPk(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const isValid = await user.validatePassword(currentPassword);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Senha atual incorreta'
        });
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      // Enviar notificação por email
      await emailService.sendPasswordChanged(user.email, {
        name: user.name
      });

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao alterar senha'
      });
    }
  }
}

module.exports = new AuthController();
