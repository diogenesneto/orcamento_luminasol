// src/services/documentService.js
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ExcelJS = require('exceljs');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const logger = require('../utils/logger');

class DocumentService {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
    this.outputPath = path.join(__dirname, '../../generated');
    
    // Garantir que o diretório de saída existe
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Gera documento Word baseado no template
   */
  async generateProposal(budget, client, options = {}) {
    try {
      const templatePath = path.join(this.templatesPath, 'proposal-template.docx');
      
      // Verificar se o template existe
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template de proposta não encontrado');
      }

      // Ler o template
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '[',
          end: ']'
        }
      });

      // Preparar dados para o template
      const templateData = this.prepareTemplateData(budget, client, options);

      // Processar o template
      doc.render(templateData);

      // Gerar o buffer do documento
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: "DEFLATE"
      });

      // Salvar o documento
      const filename = `Proposta_${budget.budgetNumber}_${client.name.replace(/\s/g, '_')}.docx`;
      const filepath = path.join(this.outputPath, filename);
      fs.writeFileSync(filepath, buf);

      logger.info(`Documento gerado: ${filename}`);

      return {
        filename,
        filepath,
        url: `/generated/${filename}`
      };
    } catch (error) {
      logger.error('Erro ao gerar documento:', error);
      throw error;
    }
  }

  /**
   * Prepara os dados para o template
   */
  prepareTemplateData(budget, client, options) {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatNumber = (value, decimals = 2) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    };

    // Dados básicos
    const data = {
      // Informações da empresa
      empresa_nome: 'LuminaSol Energia Solar',
      empresa_telefone: '(92) 98829-9040',
      empresa_email: 'contato@luminasol.com.br',
      empresa_endereco: 'Av. Djalma Batista, 1661 - Millennium Center',
      empresa_cidade: 'Manaus - AM',

      // Dados do cliente
      cliente_nome: client.name,
      cliente_telefone: client.phone,
      cliente_email: client.email || '',
      cliente_endereco: client.address ? 
        `${client.address.street}, ${client.address.number} - ${client.address.neighborhood}` : '',
      cliente_cidade: client.address ? 
        `${client.address.city}/${client.address.state}` : 'Manaus/AM',

      // Dados do orçamento
      orcamento_numero: budget.budgetNumber,
      orcamento_data: format(new Date(budget.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      orcamento_validade: format(new Date(budget.validUntil), 'dd/MM/yyyy'),

      // Responsável
      responsavel_nome: options.responsibleName || 'Consultor LuminaSol',
      cidade: 'Manaus',
      data_atual: format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    };

    // Dados específicos para orçamento solar
    if (budget.type === 'solar' && budget.solarData) {
      const solar = budget.solarData;
      
      Object.assign(data, {
        // Sistema
        modulo_quantidade: solar.system.panelQuantity,
        modulo_fabricante: options.panelBrand || 'Canadian Solar',
        modulo_modelo: options.panelModel || 'HiKu6',
        modulo_potencia: solar.system.panelPower,
        inversor_fabricante: options.inverterBrand || 'Growatt',
        inversor_modelo: `${solar.system.inverter.nominal}kW`,
        inversores_utilizados: 1,
        potencia_sistema: formatNumber(solar.system.systemPower, 2),

        // Valores
        preco: formatNumber(budget.financial.total, 2),
        vc_a_vista: formatNumber(budget.financial.total * 0.9, 2),
        valor_desconto: formatNumber(budget.financial.total * 0.1, 2),

        // Produção estimada
        geracao_mensal: Math.round(solar.production.monthlyAverage),
        economia_mensal: formatCurrency(solar.production.monthlyEconomy),
        economia_anual: formatCurrency(solar.production.yearlyEconomy),
        valor_kwh: formatNumber(solar.production.tariff, 2),

        // Materiais inclusos
        materiais_inclusos: budget.materials || this.getDefaultMaterials()
      });
    }

    // Dados específicos para orçamento de serviços
    if (budget.type === 'service' && budget.serviceData) {
      const services = budget.serviceData.items || [];
      
      Object.assign(data, {
        servicos: services.map(service => ({
          descricao: service.description,
          quantidade: service.quantity,
          valor_unitario: formatCurrency(service.unitPrice),
          valor_total: formatCurrency(service.totalPrice)
        })),
        servico_total: formatCurrency(budget.financial.total),
        servico_observacoes: budget.observations || ''
      });
    }

    return data;
  }

  /**
   * Lista de materiais padrão
   */
  getDefaultMaterials() {
    return [
      'Painéis Solares Fotovoltaicos com garantia de 25 anos',
      'Inversor de Frequência com garantia de 7 anos',
      'Estrutura de Fixação em Alumínio Anodizado',
      'Cabos Solares especiais para corrente contínua',
      'Conectores MC4 originais',
      'String Box CC e CA com proteções',
      'DPS - Dispositivos de Proteção contra Surtos',
      'Sistema de Aterramento completo',
      'Parafusos e acessórios em aço inoxidável',
      'Sistema de Monitoramento Online',
      'Projeto técnico assinado por engenheiro',
      'ART - Anotação de Responsabilidade Técnica',
      'Homologação junto à concessionária',
      'Manual de operação e manutenção'
    ];
  }

  /**
   * Gera planilha Excel com o orçamento
   */
  async generateExcel(budget, client) {
    const workbook = new ExcelJS.Workbook();
    
    // Configurações do workbook
    workbook.creator = 'LuminaSol';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Aba de resumo
    const summarySheet = workbook.addWorksheet('Resumo');
    this.createSummarySheet(summarySheet, budget, client);

    // Aba de detalhamento (para solar)
    if (budget.type === 'solar') {
      const detailSheet = workbook.addWorksheet('Detalhamento');
      this.createSolarDetailSheet(detailSheet, budget);

      const economySheet = workbook.addWorksheet('Projeção de Economia');
      this.createEconomyProjectionSheet(economySheet, budget);
    }

    // Aba de serviços (se aplicável)
    if (budget.type === 'service') {
      const servicesSheet = workbook.addWorksheet('Serviços');
      this.createServicesSheet(servicesSheet, budget);
    }

    // Salvar o arquivo
    const filename = `Orcamento_${budget.budgetNumber}_${client.name.replace(/\s/g, '_')}.xlsx`;
    const filepath = path.join(this.outputPath, filename);
    
    await workbook.xlsx.writeFile(filepath);

    logger.info(`Planilha gerada: ${filename}`);

    return {
      filename,
      filepath,
      url: `/generated/${filename}`
    };
  }

  /**
   * Cria aba de resumo no Excel
   */
  createSummarySheet(sheet, budget, client) {
    // Estilo do cabeçalho
    sheet.getRow(1).height = 30;
    sheet.getCell('A1').value = 'ORÇAMENTO LUMINASOL';
    sheet.getCell('A1').font = { size: 20, bold: true, color: { argb: 'FFF0C14B' } };
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Informações do cliente
    sheet.getCell('A3').value = 'DADOS DO CLIENTE';
    sheet.getCell('A3').font = { bold: true, size: 14 };
    sheet.mergeCells('A3:D3');

    const clientData = [
      ['Nome:', client.name],
      ['Telefone:', client.phone],
      ['E-mail:', client.email || '-'],
      ['Endereço:', client.address ? client.getFullAddress() : '-']
    ];

    let row = 4;
    clientData.forEach(data => {
      sheet.getCell(`A${row}`).value = data[0];
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`B${row}`).value = data[1];
      sheet.mergeCells(`B${row}:D${row}`);
      row++;
    });

    // Resumo financeiro
    row += 2;
    sheet.getCell(`A${row}`).value = 'RESUMO FINANCEIRO';
    sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${row}:D${row}`);

    row++;
    const financialData = [
      ['Valor Total:', budget.financial.total, 'currency'],
      ['Desconto à Vista (10%):', budget.financial.total * 0.1, 'currency'],
      ['Valor à Vista:', budget.financial.total * 0.9, 'currency'],
      ['Parcelamento:', `${budget.financial.paymentConditions.installments.max}x sem juros`, 'text']
    ];

    financialData.forEach(data => {
      sheet.getCell(`A${row}`).value = data[0];
      sheet.getCell(`A${row}`).font = { bold: true };
      sheet.getCell(`C${row}`).value = data[1];
      
      if (data[2] === 'currency') {
        sheet.getCell(`C${row}`).numFmt = 'R$ #,##0.00';
      }
      
      sheet.mergeCells(`C${row}:D${row}`);
      row++;
    });

    // Ajustar largura das colunas
    sheet.getColumn('A').width = 20;
    sheet.getColumn('B').width = 30;
    sheet.getColumn('C').width = 20;
    sheet.getColumn('D').width = 20;
  }

  /**
   * Cria aba de detalhamento solar
   */
  createSolarDetailSheet(sheet, budget) {
    const solar = budget.solarData;
    
    // Cabeçalho
    sheet.getCell('A1').value = 'DETALHAMENTO DO SISTEMA SOLAR';
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.mergeCells('A1:E1');

    // Dados do sistema
    const systemData = [
      ['Componente', 'Quantidade', 'Potência Unit.', 'Potência Total', 'Observações'],
      [
        'Painéis Solares',
        solar.system.panelQuantity,
        `${solar.system.panelPower}W`,
        `${solar.system.systemPower.toFixed(2)} kWp`,
        'Garantia 25 anos'
      ],
      [
        'Inversor',
        1,
        `${solar.system.inverter.nominal}kW`,
        `${solar.system.inverter.nominal}kW`,
        'Garantia 7 anos'
      ]
    ];

    let row = 3;
    systemData.forEach((data, index) => {
      data.forEach((cell, colIndex) => {
        const cellRef = sheet.getCell(row, colIndex + 1);
        cellRef.value = cell;
        
        if (index === 0) {
          cellRef.font = { bold: true };
          cellRef.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0C14B' }
          };
        }
      });
      row++;
    });

    // Cálculos
    row += 2;
    sheet.getCell(`A${row}`).value = 'CÁLCULOS DO SISTEMA';
    sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${row}:E${row}`);

    row++;
    const calculations = [
      ['Descrição', 'Valor', 'Unidade'],
      ['Produção Mensal Média', solar.production.monthlyAverage.toFixed(0), 'kWh'],
      ['Produção Anual', solar.production.yearlyTotal.toFixed(0), 'kWh'],
      ['Economia Mensal', solar.production.monthlyEconomy.toFixed(2), 'R$'],
      ['Economia Anual', solar.production.yearlyEconomy.toFixed(2), 'R$'],
      ['Tarifa Atual', solar.production.tariff.toFixed(2), 'R$/kWh']
    ];

    calculations.forEach((data, index) => {
      data.forEach((cell, colIndex) => {
        const cellRef = sheet.getCell(row, colIndex + 1);
        cellRef.value = cell;
        
        if (index === 0) {
          cellRef.font = { bold: true };
        }
      });
      row++;
    });

    // Ajustar larguras
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 15;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 15;
    sheet.getColumn('E').width = 25;
  }

  /**
   * Cria aba de projeção de economia
   */
  createEconomyProjectionSheet(sheet, budget) {
    const solar = budget.solarData;
    
    sheet.getCell('A1').value = 'PROJEÇÃO DE ECONOMIA - 25 ANOS';
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.mergeCells('A1:F1');

    // Cabeçalhos
    const headers = ['Ano', 'Produção (kWh)', 'Tarifa (R$/kWh)', 'Economia Anual', 'Economia Acumulada', 'ROI'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5CC' }
      };
    });

    // Projeção ano a ano
    let row = 4;
    let accumulatedEconomy = 0;
    let currentTariff = solar.production.tariff;
    const annualProduction = solar.production.yearlyTotal;
    const investmentValue = budget.financial.total;
    const tariffIncrease = 0.07; // 7% ao ano

    for (let year = 1; year <= 25; year++) {
      const yearlyEconomy = annualProduction * currentTariff;
      accumulatedEconomy += yearlyEconomy;
      const roi = ((accumulatedEconomy - investmentValue) / investmentValue) * 100;

      sheet.getCell(`A${row}`).value = year;
      sheet.getCell(`B${row}`).value = annualProduction;
      sheet.getCell(`C${row}`).value = currentTariff;
      sheet.getCell(`D${row}`).value = yearlyEconomy;
      sheet.getCell(`E${row}`).value = accumulatedEconomy;
      sheet.getCell(`F${row}`).value = roi;

      // Formatação
      sheet.getCell(`B${row}`).numFmt = '#,##0';
      sheet.getCell(`C${row}`).numFmt = 'R$ #,##0.00';
      sheet.getCell(`D${row}`).numFmt = 'R$ #,##0.00';
      sheet.getCell(`E${row}`).numFmt = 'R$ #,##0.00';
      sheet.getCell(`F${row}`).numFmt = '#,##0.00"%"';

      // Destacar quando ROI fica positivo
      if (roi > 0 && sheet.getCell(`F${row - 1}`).value <= 0) {
        sheet.getRow(row).font = { bold: true, color: { argb: 'FF008000' } };
      }

      currentTariff *= (1 + tariffIncrease);
      row++;
    }

    // Resumo
    row += 2;
    sheet.getCell(`A${row}`).value = 'RESUMO';
    sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    sheet.mergeCells(`A${row}:F${row}`);

    row++;
    sheet.getCell(`A${row}`).value = 'Economia Total em 25 anos:';
    sheet.getCell(`C${row}`).value = accumulatedEconomy;
    sheet.getCell(`C${row}`).numFmt = 'R$ #,##0.00';
    sheet.getCell(`C${row}`).font = { bold: true, size: 14, color: { argb: 'FF008000' } };

    // Ajustar larguras
    sheet.getColumn('A').width = 10;
    sheet.getColumn('B').width = 18;
    sheet.getColumn('C').width = 18;
    sheet.getColumn('D').width = 20;
    sheet.getColumn('E').width = 22;
    sheet.getColumn('F').width = 15;
  }

  /**
   * Cria aba de serviços
   */
  createServicesSheet(sheet, budget) {
    const services = budget.serviceData.items || [];
    
    sheet.getCell('A1').value = 'DETALHAMENTO DOS SERVIÇOS';
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.mergeCells('A1:E1');

    // Cabeçalhos
    const headers = ['Item', 'Descrição', 'Quantidade', 'Valor Unitário', 'Valor Total'];
    headers.forEach((header, index) => {
      const cell = sheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5CC' }
      };
    });

    // Serviços
    let row = 4;
    services.forEach((service, index) => {
      sheet.getCell(`A${row}`).value = index + 1;
      sheet.getCell(`B${row}`).value = service.description;
      sheet.getCell(`C${row}`).value = service.quantity;
      sheet.getCell(`D${row}`).value = service.unitPrice;
      sheet.getCell(`E${row}`).value = service.totalPrice;

      // Formatação
      sheet.getCell(`D${row}`).numFmt = 'R$ #,##0.00';
      sheet.getCell(`E${row}`).numFmt = 'R$ #,##0.00';

      row++;
    });

    // Total
    row++;
    sheet.getCell(`D${row}`).value = 'TOTAL:';
    sheet.getCell(`D${row}`).font = { bold: true };
    sheet.getCell(`E${row}`).value = budget.financial.total;
    sheet.getCell(`E${row}`).numFmt = 'R$ #,##0.00';
    sheet.getCell(`E${row}`).font = { bold: true, size: 14 };

    // Observações
    if (budget.observations) {
      row += 2;
      sheet.getCell(`A${row}`).value = 'OBSERVAÇÕES:';
      sheet.getCell(`A${row}`).font = { bold: true };
      row++;
      sheet.getCell(`A${row}`).value = budget.observations;
      sheet.mergeCells(`A${row}:E${row + 3}`);
      sheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
    }

    // Ajustar larguras
    sheet.getColumn('A').width = 10;
    sheet.getColumn('B').width = 40;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 20;
    sheet.getColumn('E').width = 20;
  }

  /**
   * Gera link único para visualização online
   */
  generateUniqueLink(proposalId) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/proposal/${proposalId}`;
  }

  /**
   * Formata mensagem para WhatsApp
   */
  formatWhatsAppMessage(budget, client, proposalLink) {
    const message = `Olá ${client.name}, segue o orçamento para seu Sistema Solar:

🌞 *ORÇAMENTO ${budget.budgetNumber}*

📊 *Sistema Solar de ${budget.solarData.system.systemPower.toFixed(2)} kWp*
• ${budget.solarData.system.panelQuantity} painéis solares
• Inversor de ${budget.solarData.system.inverter.nominal}kW
• Produção: ~${Math.round(budget.solarData.production.monthlyAverage)} kWh/mês

💰 *Investimento*
• Total: R$ ${budget.financial.total.toLocaleString('pt-BR')}
• À vista (10% desc.): R$ ${(budget.financial.total * 0.9).toLocaleString('pt-BR')}
• Parcelado: até ${budget.financial.paymentConditions.installments.max}x sem juros

✅ *Economia Estimada*
• Mensal: R$ ${budget.solarData.production.monthlyEconomy.toFixed(2)}
• Anual: R$ ${budget.solarData.production.yearlyEconomy.toFixed(2)}
• 25 anos: R$ ${(budget.solarData.production.yearlyEconomy * 25).toLocaleString('pt-BR')}

📱 *Veja sua proposta completa:*
${proposalLink}

Válida até: ${format(new Date(budget.validUntil), 'dd/MM/yyyy')}

Dúvidas? Fale conosco:
📞 (92) 98829-9040`;

    return encodeURIComponent(message);
  }
}

module.exports = new DocumentService();
