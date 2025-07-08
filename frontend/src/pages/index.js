// Formulário de Orçamento Solar - Sistema LuminaSol
import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Calculator, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  DollarSign,
  Settings,
  Save,
  Send,
  Eye,
  Download,
  Zap,
  TrendingUp,
  AlertCircle,
  Check,
  Plus,
  Trash2
} from 'lucide-react';

// Componente de Input customizado
const FormInput = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, prefix, suffix, required = false }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{prefix}</span>
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`block w-full ${Icon ? 'pl-10' : prefix ? 'pl-8' : 'pl-3'} ${suffix ? 'pr-12' : 'pr-3'} py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500`}
          required={required}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{suffix}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de Card de Resultado
const ResultCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-8 w-8 opacity-50" />
      </div>
    </div>
  );
};

export default function SolarBudgetForm() {
  // Estados do formulário
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Dados do Cliente
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    
    // Dimensionamento
    desiredPower: 1000,
    panelPower: 610,
    magicNumber: 107,
    
    // Valores
    kitValueMethod: 'perKwp', // 'perKwp' ou 'total'
    valuePerKwp: 1.4,
    totalKitValue: 0,
    materialValue: 2000,
    laborPerKwp: 350,
    profitMargin: 25,
    enableCommission: false,
    commissionPercentage: 5,
    
    // Configurações
    kwHValue: 0.86,
    includeGraphs: true,
    validityDays: 15,
    paymentConditions: {
      cash: 10,
      installments: 18,
      financing: true
    }
  });

  const [calculations, setCalculations] = useState({
    panelQuantity: 0,
    systemPower: 0,
    inverter: null,
    kitValue: 0,
    laborValue: 0,
    tax: 0,
    profit: 0,
    commission: 0,
    totalValue: 0,
    monthlyProduction: 0,
    monthlyEconomy: 0,
    yearlyEconomy: 0
  });

  const [materials, setMaterials] = useState([
    'Painéis Solares Fotovoltaicos',
    'Inversor de Frequência',
    'Cabos Solares CC/CA',
    'Estrutura de Fixação para Telhado',
    'Stringbox DC e CA',
    'Conectores MC4',
    'Disjuntores DC e AC',
    'DPS - Dispositivo de Proteção contra Surtos',
    'Parafusos e Acessórios para Fixação',
    'Sistema de Aterramento',
    'Etiquetas de Identificação e Sinalização'
  ]);

  const steps = [
    { label: 'Dados do Cliente', icon: User },
    { label: 'Dimensionamento', icon: Calculator },
    { label: 'Valores e Custos', icon: DollarSign },
    { label: 'Revisão e Envio', icon: FileText }
  ];

  // Cálculos automáticos
  useEffect(() => {
    calculateSystem();
  }, [formData.desiredPower, formData.panelPower, formData.magicNumber, 
      formData.valuePerKwp, formData.totalKitValue, formData.kitValueMethod,
      formData.materialValue, formData.laborPerKwp, formData.profitMargin,
      formData.enableCommission, formData.commissionPercentage, formData.kwHValue]);

  const calculateSystem = () => {
    // Cálculo de painéis
    const qtdPaineis = Math.ceil(((formData.desiredPower / formData.magicNumber) * 1000) / formData.panelPower);
    const potenciaKwp = (qtdPaineis * formData.panelPower) / 1000;
    
    // Seleção do inversor
    const inversores = [3, 5, 7.5, 8, 10, 15, 20, 25, 30, 50, 75];
    const potenciaMinima = potenciaKwp / 1.6;
    const inversorSelecionado = inversores.find(inv => inv >= potenciaMinima);
    
    // Cálculo financeiro
    let valorKit = formData.kitValueMethod === 'perKwp' 
      ? potenciaKwp * 1000 * formData.valuePerKwp
      : formData.totalKitValue;
    
    const maoObra = potenciaKwp * formData.laborPerKwp;
    const baseImposto = formData.materialValue + maoObra;
    const imposto = baseImposto * 0.06;
    const subtotal = valorKit + formData.materialValue + maoObra + imposto;
    const lucro = subtotal * (formData.profitMargin / 100);
    const comissao = formData.enableCommission ? lucro * (formData.commissionPercentage / 100) : 0;
    const total = subtotal + lucro + comissao;
    
    // Cálculo de produção e economia (Manaus)
    const fatoresSazonais = [0.914, 0.93, 0.935, 0.886, 0.898, 1.016, 1.025, 1.141, 1.131, 1.101, 1.071, 0.953];
    const baseProducao = 107.88; // kWh/kWp/mês para Manaus
    const producaoMensal = fatoresSazonais.map(f => potenciaKwp * baseProducao * f);
    const producaoMediaMensal = producaoMensal.reduce((a, b) => a + b, 0) / 12;
    const economiaMediaMensal = producaoMediaMensal * formData.kwHValue;
    const economiaAnual = economiaMediaMensal * 12;
    
    setCalculations({
      panelQuantity: qtdPaineis,
      systemPower: potenciaKwp,
      inverter: inversorSelecionado ? {
        nominal: inversorSelecionado,
        maximum: inversorSelecionado * 1.6,
        minRequired: potenciaMinima
      } : null,
      kitValue: valorKit,
      laborValue: maoObra,
      tax: imposto,
      profit: lucro,
      commission: comissao,
      totalValue: total,
      monthlyProduction: producaoMediaMensal,
      monthlyEconomy: economiaMediaMensal,
      yearlyEconomy: economiaAnual
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSave = () => {
    // Implementar salvamento
    console.log('Salvando orçamento...', formData, calculations);
    alert('Orçamento salvo com sucesso!');
  };

  const handleGenerate = () => {
    // Implementar geração de documentos
    console.log('Gerando documentos...', formData, calculations);
    alert('Documentos gerados com sucesso!');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Dados do Cliente
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Nome do Cliente"
                  icon={User}
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="João Silva"
                  required
                />
                <FormInput
                  label="Telefone"
                  icon={Phone}
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                  placeholder="(92) 98765-4321"
                  required
                />
                <FormInput
                  label="E-mail"
                  icon={Mail}
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  placeholder="cliente@email.com"
                />
                <FormInput
                  label="Endereço"
                  icon={MapPin}
                  value={formData.clientAddress}
                  onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                  placeholder="Av. Principal, 123 - Manaus/AM"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Dimensionamento
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Dimensionamento do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Potência Desejada"
                  icon={Zap}
                  type="number"
                  value={formData.desiredPower}
                  onChange={(e) => handleInputChange('desiredPower', parseFloat(e.target.value))}
                  suffix="kW"
                  required
                />
                <FormInput
                  label="Potência da Placa"
                  icon={Sun}
                  type="number"
                  value={formData.panelPower}
                  onChange={(e) => handleInputChange('panelPower', parseFloat(e.target.value))}
                  suffix="W"
                  required
                />
                <FormInput
                  label="Número Mágico"
                  icon={Calculator}
                  type="number"
                  value={formData.magicNumber}
                  onChange={(e) => handleInputChange('magicNumber', parseFloat(e.target.value))}
                  required
                />
              </div>

              {calculations.systemPower > 0 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Check className="w-5 h-5 text-green-600 mr-2" />
                    Resultados do Dimensionamento
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ResultCard
                      title="Quantidade de Placas"
                      value={`${calculations.panelQuantity} unidades`}
                      icon={Sun}
                      color="yellow"
                    />
                    <ResultCard
                      title="Potência do Sistema"
                      value={`${calculations.systemPower.toFixed(2)} kWp`}
                      icon={Zap}
                      color="blue"
                    />
                    {calculations.inverter && (
                      <ResultCard
                        title="Inversor Recomendado"
                        value={`${calculations.inverter.nominal} kW`}
                        icon={Settings}
                        color="purple"
                      />
                    )}
                  </div>
                  
                  {calculations.inverter && (
                    <div className="mt-4 text-sm text-gray-600">
                      <p>• Potência mínima necessária: {calculations.inverter.minRequired.toFixed(2)} kW</p>
                      <p>• Capacidade máxima (com overload): {calculations.inverter.maximum.toFixed(1)} kWp</p>
                      <p>• Máximo de painéis suportados: {Math.floor((calculations.inverter.maximum * 1000) / formData.panelPower)} unidades</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Configurações de Economia</h4>
                <FormInput
                  label="Valor do kWh em Manaus"
                  icon={DollarSign}
                  type="number"
                  value={formData.kwHValue}
                  onChange={(e) => handleInputChange('kwHValue', parseFloat(e.target.value))}
                  prefix="R$"
                  step="0.01"
                />
                
                {calculations.monthlyEconomy > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ResultCard
                      title="Produção Mensal"
                      value={`${calculations.monthlyProduction.toFixed(0)} kWh`}
                      icon={TrendingUp}
                      color="green"
                    />
                    <ResultCard
                      title="Economia Mensal"
                      value={`R$ ${calculations.monthlyEconomy.toFixed(2)}`}
                      icon={DollarSign}
                      color="green"
                    />
                    <ResultCard
                      title="Economia Anual"
                      value={`R$ ${calculations.yearlyEconomy.toFixed(2)}`}
                      icon={TrendingUp}
                      color="green"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2: // Valores e Custos
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cálculo do Orçamento</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de cálculo do kit
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="perKwp"
                      checked={formData.kitValueMethod === 'perKwp'}
                      onChange={(e) => handleInputChange('kitValueMethod', e.target.value)}
                      className="mr-2"
                    />
                    Valor por kWp
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="total"
                      checked={formData.kitValueMethod === 'total'}
                      onChange={(e) => handleInputChange('kitValueMethod', e.target.value)}
                      className="mr-2"
                    />
                    Valor total do kit
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.kitValueMethod === 'perKwp' ? (
                  <FormInput
                    label="Valor do kWp"
                    icon={DollarSign}
                    type="number"
                    value={formData.valuePerKwp}
                    onChange={(e) => handleInputChange('valuePerKwp', parseFloat(e.target.value))}
                    prefix="R$"
                    step="0.1"
                  />
                ) : (
                  <FormInput
                    label={`Valor total do kit (${calculations.systemPower.toFixed(2)} kWp)`}
                    icon={DollarSign}
                    type="number"
                    value={formData.totalKitValue}
                    onChange={(e) => handleInputChange('totalKitValue', parseFloat(e.target.value))}
                    prefix="R$"
                  />
                )}
                
                <FormInput
                  label="Valor do Material"
                  icon={DollarSign}
                  type="number"
                  value={formData.materialValue}
                  onChange={(e) => handleInputChange('materialValue', parseFloat(e.target.value))}
                  prefix="R$"
                />
                
                <FormInput
                  label="Valor da Mão de Obra por kWp"
                  icon={DollarSign}
                  type="number"
                  value={formData.laborPerKwp}
                  onChange={(e) => handleInputChange('laborPerKwp', parseFloat(e.target.value))}
                  prefix="R$"
                />
                
                <FormInput
                  label="Margem de Lucro"
                  type="number"
                  value={formData.profitMargin}
                  onChange={(e) => handleInputChange('profitMargin', parseFloat(e.target.value))}
                  suffix="%"
                />
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="enableCommission"
                    checked={formData.enableCommission}
                    onChange={(e) => handleInputChange('enableCommission', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="enableCommission" className="text-sm font-medium text-gray-700">
                    Habilitar Comissão
                  </label>
                </div>
                
                {formData.enableCommission && (
                  <FormInput
                    label="Valor da Comissão (% sobre o lucro)"
                    type="number"
                    value={formData.commissionPercentage}
                    onChange={(e) => handleInputChange('commissionPercentage', parseFloat(e.target.value))}
                    suffix="%"
                  />
                )}
              </div>

              {calculations.totalValue > 0 && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Resumo do Orçamento</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Valor do KIT:</span>
                      <span className="font-medium">R$ {calculations.kitValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span className="font-medium">R$ {formData.materialValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mão de Obra:</span>
                      <span className="font-medium">R$ {calculations.laborValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Imposto (6%):</span>
                      <span className="font-medium">R$ {calculations.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margem de Lucro:</span>
                      <span className="font-medium">R$ {calculations.profit.toFixed(2)}</span>
                    </div>
                    {formData.enableCommission && (
                      <div className="flex justify-between">
                        <span>Comissão:</span>
                        <span className="font-medium">R$ {calculations.commission.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span className="text-blue-600">R$ {calculations.totalValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>À vista (10% desc.):</span>
                        <span>R$ {(calculations.totalValue * 0.9).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Materiais Inclusos</h4>
                <div className="space-y-2">
                  {materials.map((material, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{material}</span>
                      <button
                        onClick={() => setMaterials(materials.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newMaterial = prompt('Digite o novo material:');
                      if (newMaterial) setMaterials([...materials, newMaterial]);
                    }}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Material
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Revisão e Envio
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revisão do Orçamento</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Dados do Cliente</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Nome:</dt>
                        <dd className="font-medium">{formData.clientName || '-'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Telefone:</dt>
                        <dd className="font-medium">{formData.clientPhone || '-'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">E-mail:</dt>
                        <dd className="font-medium">{formData.clientEmail || '-'}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Sistema Solar</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Potência:</dt>
                        <dd className="font-medium">{calculations.systemPower.toFixed(2)} kWp</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Painéis:</dt>
                        <dd className="font-medium">{calculations.panelQuantity} unidades</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Inversor:</dt>
                        <dd className="font-medium">{calculations.inverter?.nominal || '-'} kW</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">Resumo Financeiro</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold">Valor Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        R$ {calculations.totalValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>• À vista (10% desc.): R$ {(calculations.totalValue * 0.9).toFixed(2)}</p>
                      <p>• Parcelado: até 18x sem juros</p>
                      <p>• Economia mensal estimada: R$ {calculations.monthlyEconomy.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Informações Importantes:</p>
                    <ul className="mt-1 list-disc list-inside text-yellow-700">
                      <li>Orçamento válido por {formData.validityDays} dias</li>
                      <li>Inclui instalação e homologação junto à concessionária</li>
                      <li>Garantia de 25 anos nos painéis solares</li>
                      <li>Economia calculada com base na tarifa atual de Manaus</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Rascunho
                </button>
                
                <button
                  onClick={handleGenerate}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Gerar Documentos
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </button>
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </button>
                <button className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar ao Cliente
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sun className="w-8 h-8 text-yellow-500 mr-3" />
                Novo Orçamento Solar
              </h1>
              <p className="text-gray-600 mt-1">
                Crie um orçamento completo para sistema fotovoltaico
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Data</p>
              <p className="text-lg font-medium">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      activeStep >= index
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`ml-3 text-sm font-medium ${
                      activeStep >= index ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-4 h-0.5 w-20 ${
                        activeStep > index ? 'bg-yellow-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={activeStep === 0}
            className={`px-6 py-2 rounded-lg font-medium ${
              activeStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Voltar
          </button>
          
          {activeStep < steps.length - 1 && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
            >
              Próximo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
