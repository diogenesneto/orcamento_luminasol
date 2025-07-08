// Portal do Cliente - Visualização de Proposta Online
import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Check, 
  X, 
  Download, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Zap,
  Shield,
  Clock,
  ChevronRight,
  FileText,
  CreditCard,
  Info,
  CheckCircle,
  AlertCircle,
  Building
} from 'lucide-react';

// Componente de Status da Proposta
const ProposalStatus = ({ status, viewedAt, acceptedAt }) => {
  const statusConfig = {
    sent: {
      color: 'blue',
      icon: Clock,
      text: 'Proposta Enviada',
      description: 'Sua proposta está pronta para visualização'
    },
    viewed: {
      color: 'yellow',
      icon: AlertCircle,
      text: 'Em Análise',
      description: 'Você está analisando esta proposta'
    },
    accepted: {
      color: 'green',
      icon: CheckCircle,
      text: 'Proposta Aceita',
      description: 'Parabéns! Sua proposta foi aceita'
    },
    rejected: {
      color: 'red',
      icon: X,
      text: 'Proposta Recusada',
      description: 'Esta proposta foi recusada'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`bg-${config.color}-50 border border-${config.color}-200 rounded-lg p-4 mb-6`}>
      <div className="flex items-start">
        <Icon className={`w-6 h-6 text-${config.color}-600 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          <h3 className={`text-lg font-semibold text-${config.color}-900`}>{config.text}</h3>
          <p className={`text-sm text-${config.color}-700 mt-1`}>{config.description}</p>
          {viewedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Visualizada em: {new Date(viewedAt).toLocaleString('pt-BR')}
            </p>
          )}
          {acceptedAt && (
            <p className="text-xs text-gray-500">
              Aceita em: {new Date(acceptedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Card de Benefício
const BenefitCard = ({ icon: Icon, title, description, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

// Componente de Gráfico de Economia
const EconomyChart = ({ monthlyData, yearlyProjection }) => {
  const maxValue = Math.max(...monthlyData.map(d => d.value));
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Projeção de Economia Mensal
      </h3>
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between space-x-2">
          {monthlyData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t transition-all duration-500 hover:from-yellow-600 hover:to-yellow-400"
                style={{
                  height: `${(data.value / maxValue) * 100}%`,
                  minHeight: '20px'
                }}
              />
              <span className="text-xs text-gray-600 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Economia Total em 25 anos</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {yearlyProjection.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">ROI Estimado</p>
            <p className="text-lg font-semibold text-gray-900">4-6 anos</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Principal do Portal do Cliente
export default function ClientProposalPortal() {
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  // Simular carregamento de dados
  useEffect(() => {
    setTimeout(() => {
      setProposal({
        id: 'PROP-2024-0156',
        budgetNumber: 'ORC-202402-0156',
        status: 'viewed',
        viewedAt: new Date().toISOString(),
        client: {
          name: 'João Silva',
          phone: '(92) 98765-4321',
          email: 'joao.silva@email.com',
          address: 'Av. Djalma Batista, 123 - Manaus/AM'
        },
        system: {
          power: 8.54,
          panels: 14,
          panelModel: 'Canadian Solar 610W',
          inverter: '8kW Growatt',
          monthlyProduction: 920,
          yearlyProduction: 11040
        },
        financial: {
          total: 28500,
          cashDiscount: 2850,
          cashTotal: 25650,
          installments: 18,
          installmentValue: 1583.33,
          monthlyEconomy: 791.20,
          yearlyEconomy: 9494.40,
          totalEconomy25Years: 285600
        },
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        materials: [
          '14 Painéis Solares Canadian Solar 610W',
          '1 Inversor Growatt 8kW',
          'Estrutura de Fixação em Alumínio',
          'Cabeamento Solar e Conectores MC4',
          'String Box CC/CA com Proteções',
          'Sistema de Monitoramento Online',
          'Aterramento e SPDA'
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  const monthlyData = [
    { month: 'Jan', value: 820 },
    { month: 'Fev', value: 850 },
    { month: 'Mar', value: 880 },
    { month: 'Abr', value: 790 },
    { month: 'Mai', value: 810 },
    { month: 'Jun', value: 920 },
    { month: 'Jul', value: 950 },
    { month: 'Ago', value: 1020 },
    { month: 'Set', value: 1000 },
    { month: 'Out', value: 970 },
    { month: 'Nov', value: 930 },
    { month: 'Dez', value: 850 }
  ];

  const handleAccept = () => {
    setShowAcceptModal(true);
  };

  const confirmAccept = () => {
    // Implementar lógica de aceite
    alert('Proposta aceita com sucesso! Entraremos em contato em breve.');
    setShowAcceptModal(false);
    setProposal(prev => ({
      ...prev,
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Sun className="w-16 h-16 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando sua proposta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Sun className="w-10 h-10 text-yellow-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LuminaSol</h1>
                <p className="text-sm text-gray-600">Energia Solar</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="tel:+559288299040" className="flex items-center text-gray-600 hover:text-gray-900">
                <Phone className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">(92) 98829-9040</span>
              </a>
              <a href="mailto:contato@luminasol.com.br" className="flex items-center text-gray-600 hover:text-gray-900">
                <Mail className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">contato@luminasol.com.br</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Sua Proposta de Energia Solar
            </h2>
            <p className="text-xl mb-2">
              Olá {proposal.client.name}, preparamos uma solução especial para você!
            </p>
            <p className="text-lg opacity-90">
              Proposta #{proposal.id} • Válida até {new Date(proposal.validUntil).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status */}
        <ProposalStatus 
          status={proposal.status}
          viewedAt={proposal.viewedAt}
          acceptedAt={proposal.acceptedAt}
        />

        {/* System Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Seu Sistema Solar Personalizado
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sun className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{proposal.system.panels}</p>
              <p className="text-sm text-gray-600">Painéis Solares</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{proposal.system.power} kWp</p>
              <p className="text-sm text-gray-600">Potência Total</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{proposal.system.monthlyProduction}</p>
              <p className="text-sm text-gray-600">kWh/mês</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {proposal.financial.monthlyEconomy.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Economia/mês</p>
            </div>
          </div>
        </div>

        {/* Investment Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Investimento
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Valor Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  R$ {proposal.financial.total.toLocaleString('pt-BR')}
                </span>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">À Vista (10% desc.)</span>
                  <span className="text-lg font-semibold text-green-600">
                    R$ {proposal.financial.cashTotal.toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Economia de R$ {proposal.financial.cashDiscount.toLocaleString('pt-BR')}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Parcelado</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {proposal.financial.installments}x R$ {proposal.financial.installmentValue.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Sem juros no cartão</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  <Info className="w-4 h-4 inline mr-1" />
                  Financiamento disponível em até 120 meses
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Simular financiamento →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Retorno do Investimento
            </h3>
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">Economia em 25 anos</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {proposal.financial.totalEconomy25Years.toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Considerando aumento de 7% a.a. na tarifa
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-lg font-semibold text-gray-900">4-6 anos</p>
                  <p className="text-xs text-gray-600">Payback estimado</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-lg font-semibold text-gray-900">900%+</p>
                  <p className="text-xs text-gray-600">ROI em 25 anos</p>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Proteção Garantida</p>
                    <p className="text-xs text-gray-600">
                      Proteja-se contra aumentos futuros na tarifa de energia
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Economy Chart */}
        <EconomyChart 
          monthlyData={monthlyData}
          yearlyProjection={proposal.financial.totalEconomy25Years}
        />

        {/* Benefits */}
        <div className="mt-8 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Por que escolher energia solar?
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <BenefitCard
              icon={DollarSign}
              title="Economia Imediata"
              description="Reduza sua conta de luz em até 95% desde o primeiro mês"
              color="green"
            />
            <BenefitCard
              icon={Shield}
              title="25 Anos de Garantia"
              description="Painéis com garantia de performance por 25 anos"
              color="blue"
            />
            <BenefitCard
              icon={Building}
              title="Valorização"
              description="Imóveis com energia solar valorizam até 8% mais"
              color="purple"
            />
            <BenefitCard
              icon={Sun}
              title="Sustentável"
              description="Energia limpa e renovável para um futuro melhor"
              color="yellow"
            />
          </div>
        </div>

        {/* Materials Included */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            O que está incluso
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {proposal.materials.map((material, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{material}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">
              Serviços Inclusos:
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Projeto e dimensionamento personalizado</li>
              <li>✓ Instalação completa por equipe certificada</li>
              <li>✓ Homologação junto à concessionária</li>
              <li>✓ Configuração do monitoramento online</li>
              <li>✓ Treinamento de uso do sistema</li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        {proposal.status !== 'accepted' && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para economizar com energia solar?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Aceite agora e comece a economizar o quanto antes!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleAccept}
                className="px-8 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                Aceitar Proposta
              </button>
              <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors flex items-center justify-center">
                <Phone className="w-5 h-5 mr-2" />
                Falar com Consultor
              </button>
            </div>
            <p className="text-sm mt-4 opacity-75">
              Proposta válida até {new Date(proposal.validUntil).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}

        {/* Company Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">LuminaSol Energia Solar</p>
          <p className="text-sm">
            Av. Djalma Batista, 1661 - Millennium Center, Torre Business, Sala 1009
          </p>
          <p className="text-sm">Manaus - AM | CEP: 69050-010</p>
          <p className="text-sm mt-2">
            <a href="tel:+559288299040" className="hover:text-gray-900">
              (92) 98829-9040
            </a>
            {' | '}
            <a href="mailto:contato@luminasol.com.br" className="hover:text-gray-900">
              contato@luminasol.com.br
            </a>
          </p>
        </div>
      </main>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Confirmar Aceitação
            </h3>
            <p className="text-gray-600 mb-6">
              Ao aceitar esta proposta, você concorda com os termos apresentados e 
              autoriza o início do processo de instalação do seu sistema solar.
            </p>
            <div className="bg-gray-50 rounded p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Próximos passos:</strong>
              </p>
              <ol className="text-sm text-gray-600 mt-2 space-y-1">
                <li>1. Nossa equipe entrará em contato em até 24h</li>
                <li>2. Agendaremos uma visita técnica</li>
                <li>3. Definiremos a data de instalação</li>
              </ol>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAcceptModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAccept}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Confirmar Aceitação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}