// Dashboard Principal - Sistema LuminaSol
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Sun, 
  Calendar,
  Bell,
  Menu,
  X,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  Eye,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';

// Componente de Card para métricas
const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
          {trend && (
            <p className={`text-sm mt-2 flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend > 0 ? '+' : ''}{trend}%
            </p>
          )}
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Componente de Tabela de Orçamentos Recentes
const RecentBudgets = ({ budgets }) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    draft: Clock,
    sent: FileText,
    viewed: Eye,
    accepted: Check,
    rejected: X
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Orçamentos Recentes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budgets.map((budget) => {
              const StatusIcon = statusIcons[budget.status];
              return (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{budget.clientName}</div>
                    <div className="text-sm text-gray-500">{budget.clientPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      budget.type === 'solar' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {budget.type === 'solar' ? <Sun className="w-3 h-3 mr-1" /> : null}
                      {budget.type === 'solar' ? 'Solar' : 'Serviço'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {budget.value.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[budget.status]}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {budget.statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {budget.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Visualizar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente Principal do Dashboard
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Dados mockados para demonstração
  const metrics = {
    totalClients: 156,
    activeBudgets: 23,
    monthlyRevenue: 45780,
    conversionRate: 68
  };

  const recentBudgets = [
    {
      id: 1,
      clientName: 'João Silva',
      clientPhone: '(92) 98765-4321',
      type: 'solar',
      value: 28500,
      status: 'accepted',
      statusText: 'Aceito',
      date: '10/02/2025'
    },
    {
      id: 2,
      clientName: 'Maria Santos',
      clientPhone: '(92) 99876-5432',
      type: 'service',
      value: 3200,
      status: 'viewed',
      statusText: 'Visualizado',
      date: '09/02/2025'
    },
    {
      id: 3,
      clientName: 'Pedro Oliveira',
      clientPhone: '(92) 98765-1234',
      type: 'solar',
      value: 42000,
      status: 'sent',
      statusText: 'Enviado',
      date: '08/02/2025'
    }
  ];

  const menuItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: Users, label: 'Clientes' },
    { icon: FileText, label: 'Orçamentos' },
    { icon: Sun, label: 'Propostas' },
    { icon: DollarSign, label: 'Financeiro' },
    { icon: Settings, label: 'Configurações' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
          <div className="flex items-center">
            <Sun className="w-8 h-8 text-yellow-400" />
            <span className="ml-2 text-xl font-bold text-white">LuminaSol</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                key={index}
                href="#"
                className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                  item.active ? 'bg-gray-800 text-white border-l-4 border-yellow-400' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="ml-3">{item.label}</span>
              </a>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 w-full">
          <a href="#" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Sair</span>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 focus:outline-none lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="ml-4 text-2xl font-semibold text-gray-800">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-6 h-6" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                )}
              </button>
              
              <div className="flex items-center space-x-3">
                <img
                  className="w-8 h-8 rounded-full"
                  src="https://ui-avatars.com/api/?name=Admin&background=f0c14b&color=fff"
                  alt="Admin"
                />
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            {/* Metrics Grid */}
            <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Total de Clientes"
                value={metrics.totalClients}
                icon={Users}
                trend={12}
                color="blue"
              />
              <MetricCard
                title="Orçamentos Ativos"
                value={metrics.activeBudgets}
                icon={FileText}
                trend={-5}
                color="yellow"
              />
              <MetricCard
                title="Receita Mensal"
                value={`R$ ${metrics.monthlyRevenue.toLocaleString('pt-BR')}`}
                icon={DollarSign}
                trend={8}
                color="green"
              />
              <MetricCard
                title="Taxa de Conversão"
                value={`${metrics.conversionRate}%`}
                icon={TrendingUp}
                trend={15}
                color="purple"
              />
            </div>

            {/* Charts and Tables */}
            <div className="grid gap-6 mb-8 md:grid-cols-1 xl:grid-cols-3">
              <div className="col-span-2">
                <RecentBudgets budgets={recentBudgets} />
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Orçamento aceito</p>
                      <p className="text-xs text-gray-500">João Silva aceitou orçamento solar</p>
                      <p className="text-xs text-gray-400 mt-1">Há 2 horas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Proposta visualizada</p>
                      <p className="text-xs text-gray-500">Maria Santos visualizou proposta</p>
                      <p className="text-xs text-gray-400 mt-1">Há 3 horas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Orçamento expirando</p>
                      <p className="text-xs text-gray-500">3 orçamentos expiram amanhã</p>
                      <p className="text-xs text-gray-400 mt-1">Há 5 horas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
