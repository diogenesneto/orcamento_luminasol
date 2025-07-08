// src/services/emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templatesPath = path.join(__dirname, '../templates/email-templates');
    this.initializeTransporter();
  }

  /**
   * Inicializa o transporter do nodemailer
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verificar conexão
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Erro na configuração do email:', error);
        } else {
          logger.info('Servidor de email configurado com sucesso');
        }
      });
    } catch (error) {
      logger.error('Erro ao inicializar transporter de email:', error);
    }
  }

  /**
   * Carrega e processa template de email
   */
  async loadTemplate(templateName, data) {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf-8');

      // Substituir variáveis no template
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, data[key]);
      });

      return template;
    } catch (error) {
      logger.error(`Erro ao carregar template ${templateName}:`, error);
      // Retornar template básico se não encontrar arquivo
      return this.getBasicTemplate(data);
    }
  }

  /**
   * Template básico para fallback
   */
  getBasicTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f0c14b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #f0c14b; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LuminaSol Energia Solar</h1>
          </div>
          <div class="content">
            ${data.content || ''}
          </div>
          <div class="footer">
            <p>LuminaSol Energia Solar<br>
            (92) 98829-9040 | contato@luminasol.com.br</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envia email genérico
   */
  async sendMail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"LuminaSol" <noreply@luminasol.com.br>',
        ...options
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email enviado: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  /**
   * Envia email de boas-vindas
   */
  async sendWelcome(to, data) {
    const html = await this.loadTemplate('welcome', {
      name: data.name,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      ...data
    });

    return this.sendMail({
      to,
      subject: 'Bem-vindo à LuminaSol!',
      html
    });
  }

  /**
   * Envia proposta para cliente
   */
  async sendProposal(to, data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f0c14b 0%, #ff9800 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background-color: #f0c14b; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .button:hover { background-color: #e0a500; }
          .highlight { background-color: #fff8e1; padding: 15px; border-left: 4px solid #f0c14b; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .info-box { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">☀️ Sua Proposta de Energia Solar Chegou!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Economize até 95% na sua conta de luz</p>
          </div>
          <div class="content">
            <h2>Olá ${data.clientName}!</h2>
            
            <p>Preparamos uma proposta exclusiva de energia solar para você. Com nosso sistema, você poderá:</p>
            
            <ul style="line-height: 2;">
              <li>💰 <strong>Economizar até 95%</strong> na conta de luz</li>
              <li>🏠 <strong>Valorizar seu imóvel</strong> em até 8%</li>
              <li>🌱 <strong>Contribuir</strong> para um planeta mais sustentável</li>
              <li>🛡️ <strong>Proteger-se</strong> contra aumentos futuros de energia</li>
            </ul>
            
            <div class="highlight">
              <p style="margin: 0;"><strong>Proposta:</strong> ${data.budgetNumber}</p>
              <p style="margin: 5px 0 0 0;"><strong>Válida até:</strong> ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.proposalLink}" class="button">
                Ver Minha Proposta Completa
              </a>
            </div>
            
            ${data.customMessage ? `
              <div class="info-box">
                <p style="margin: 0;"><strong>Mensagem do consultor:</strong></p>
                <p style="margin: 5px 0 0 0;">${data.customMessage}</p>
              </div>
            ` : ''}
            
            <p>Ao clicar no botão acima, você poderá:</p>
            <ul>
              <li>Visualizar todos os detalhes do seu sistema solar</li>
              <li>Ver a economia projetada para 25 anos</li>
              <li>Conhecer as formas de pagamento disponíveis</li>
              <li>Aceitar a proposta online</li>
            </ul>
            
            <div class="info-box" style="background-color: #e8f5e9;">
              <p style="margin: 0; color: #2e7d32;">
                <strong>🎁 Oferta Especial:</strong> Pagamento à vista com 10% de desconto!
              </p>
            </div>
            
            <p>Ficou com alguma dúvida? Entre em contato:</p>
            <p style="margin: 5px 0;">📞 <strong>(92) 98829-9040</strong></p>
            <p style="margin: 5px 0;">📧 <strong>contato@luminasol.com.br</strong></p>
          </div>
          <div class="footer">
            <p><strong>LuminaSol Energia Solar</strong><br>
            Av. Djalma Batista, 1661 - Millennium Center<br>
            Torre Business, Sala 1009 - Manaus/AM<br>
            <a href="https://www.luminasol.com.br" style="color: #f0c14b;">www.luminasol.com.br</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: `☀️ ${data.clientName}, sua proposta de energia solar está pronta!`,
      html
    });
  }

  /**
   * Envia notificação de proposta visualizada
   */
  async sendProposalViewed(to, data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; }
          .info { background-color: #e7f3ff; border: 1px solid #b3d9ff; color: #004085; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h2>👀 Proposta Visualizada!</h2>
          </div>
          
          <p>Olá!</p>
          
          <p>O cliente <strong>${data.clientName}</strong> acabou de visualizar a proposta:</p>
          
          <div class="info">
            <p><strong>Proposta:</strong> ${data.proposalNumber}</p>
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            <p><strong>Telefone:</strong> ${data.clientPhone}</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <p>Este é um bom momento para entrar em contato e tirar possíveis dúvidas!</p>
          
          <p>Atenciosamente,<br>
          Sistema LuminaSol</p>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: `👀 ${data.clientName} visualizou a proposta!`,
      html
    });
  }

  /**
   * Envia notificação de proposta aceita
   */
  async sendProposalAccepted(to, data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 5px; text-align: center; }
          .info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .next-steps { background-color: #e7f3ff; padding: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">
            <h1>🎉 Parabéns! Proposta Aceita!</h1>
          </div>
          
          <p>Excelente notícia!</p>
          
          <p>O cliente <strong>${data.clientName}</strong> aceitou a proposta de energia solar!</p>
          
          <div class="info">
            <h3>Detalhes da Proposta Aceita:</h3>
            <p><strong>Proposta:</strong> ${data.proposalNumber}</p>
            <p><strong>Cliente:</strong> ${data.clientName}</p>
            <p><strong>Telefone:</strong> ${data.clientPhone}</p>
            <p><strong>Valor:</strong> R$ ${data.value.toLocaleString('pt-BR')}</p>
            <p><strong>Sistema:</strong> ${data.systemPower} kWp</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="next-steps">
            <h3>📋 Próximos Passos:</h3>
            <ol>
              <li>Entrar em contato com o cliente em até 24h</li>
              <li>Agendar visita técnica</li>
              <li>Confirmar forma de pagamento</li>
              <li>Definir cronograma de instalação</li>
            </ol>
          </div>
          
          <p>Vamos começar a transformar mais um lar com energia solar! ☀️</p>
          
          <p>Atenciosamente,<br>
          Sistema LuminaSol</p>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: `🎉 ${data.clientName} ACEITOU a proposta!`,
      html
    });
  }

  /**
   * Envia email de reset de senha
   */
  async sendPasswordReset(to, data) {
    const html = await this.loadTemplate('password-reset', {
      name: data.name,
      resetUrl: data.resetUrl,
      ...data
    });

    return this.sendMail({
      to,
      subject: 'Redefinição de Senha - LuminaSol',
      html
    });
  }

  /**
   * Envia confirmação de alteração de senha
   */
  async sendPasswordChanged(to, data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Senha Alterada com Sucesso</h2>
          
          <p>Olá ${data.name},</p>
          
          <p>Sua senha foi alterada com sucesso. Se você não realizou esta alteração, entre em contato conosco imediatamente.</p>
          
          <div class="alert">
            <p><strong>Importante:</strong> Por segurança, você será desconectado de todos os dispositivos.</p>
          </div>
          
          <p>Data da alteração: ${new Date().toLocaleString('pt-BR')}</p>
          
          <p>Atenciosamente,<br>
          Equipe LuminaSol</p>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: 'Senha Alterada - LuminaSol',
      html
    });
  }

  /**
   * Envia relatório mensal
   */
  async sendMonthlyReport(to, data) {
    const html = await this.loadTemplate('monthly-report', {
      period: data.period,
      totalBudgets: data.totalBudgets,
      acceptedBudgets: data.acceptedBudgets,
      totalValue: data.totalValue.toLocaleString('pt-BR'),
      conversionRate: data.conversionRate,
      reportUrl: `${process.env.FRONTEND_URL}/admin/reports`,
      ...data
    });

    return this.sendMail({
      to,
      subject: `📊 Relatório Mensal - ${data.period}`,
      html,
      attachments: data.attachments || []
    });
  }

  /**
   * Envia lembrete de orçamento expirando
   */
  async sendExpiringBudgetReminder(to, data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; }
          .cta { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 15px 30px; background-color: #f0c14b; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="warning">
            <h2>⏰ Sua Proposta Está Expirando!</h2>
          </div>
          
          <p>Olá ${data.clientName},</p>
          
          <p>Sua proposta de energia solar está prestes a expirar. Não perca a oportunidade de economizar na sua conta de luz!</p>
          
          <p><strong>Proposta válida até:</strong> ${data.expirationDate}</p>
          
          <div class="cta">
            <a href="${data.proposalLink}" class="button">Ver Proposta</a>
          </div>
          
          <p>Lembre-se dos benefícios:</p>
          <ul>
            <li>Economia de até 95% na conta de luz</li>
            <li>25 anos de garantia nos painéis</li>
            <li>Valorização do seu imóvel</li>
            <li>Pagamento facilitado em até 18x</li>
          </ul>
          
          <p>Dúvidas? Fale conosco:<br>
          📞 (92) 98829-9040</p>
          
          <p>Atenciosamente,<br>
          Equipe LuminaSol</p>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to,
      subject: '⏰ Sua proposta de energia solar está expirando!',
      html
    });
  }
}

module.exports = new EmailService();
