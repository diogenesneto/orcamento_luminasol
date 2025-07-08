// src/utils/index.js

// Format currency to Brazilian format
export const formatCurrency = (value, options = {}) => {
  const {
    locale = 'pt-BR',
    currency = 'BRL',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

// Format number to Brazilian format
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${formatNumber(value, decimals)}%`;
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const numbers = phone.replace(/\D/g, '');
  
  // Check if it's a valid Brazilian phone number
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  
  return phone;
};

// Format CPF/CNPJ
export const formatDocument = (document) => {
  if (!document) return '';
  
  const numbers = document.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    // CPF format: 000.000.000-00
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (numbers.length === 14) {
    // CNPJ format: 00.000.000/0000-00
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return document;
};

// Validate CPF
export const validateCPF = (cpf) => {
  if (!cpf) return false;
  
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Check for same digits
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(10))) return false;
  
  return true;
};

// Validate CNPJ
export const validateCNPJ = (cnpj) => {
  if (!cnpj) return false;
  
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  
  // Check for same digits
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Validate check digits
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digit1 !== parseInt(numbers.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digit2 !== parseInt(numbers.charAt(13))) return false;
  
  return true;
};

// Validate email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Format date
export const formatDate = (date, format = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'dd/MM/yyyy HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'MM/yyyy':
      return `${month}/${year}`;
    case 'yyyy-MM-dd':
      return `${year}-${month}-${day}`;
    default:
      return d.toLocaleDateString('pt-BR');
  }
};

// Calculate days between dates
export const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Check if date is expired
export const isExpired = (date) => {
  return new Date(date) < new Date();
};

// Generate slug from string
export const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Unable to copy to clipboard', err);
    }
    
    document.body.removeChild(textArea);
  }
};

// Download file
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Generate random ID
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Check if user is on mobile
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Get user's location
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

// Solar calculation helpers
export const solarCalculations = {
  // Calculate panel quantity based on desired power
  calculatePanelQuantity: (desiredPower, panelPower, magicNumber) => {
    return Math.ceil(((desiredPower / magicNumber) * 1000) / panelPower);
  },
  
  // Calculate system power
  calculateSystemPower: (panelQuantity, panelPower) => {
    return (panelQuantity * panelPower) / 1000;
  },
  
  // Select appropriate inverter
  selectInverter: (systemPower) => {
    const inverters = [3, 5, 7.5, 8, 10, 15, 20, 25, 30, 50, 75];
    const minPower = systemPower / 1.6;
    return inverters.find(inv => inv >= minPower) || inverters[inverters.length - 1];
  },
  
  // Calculate monthly production for Manaus
  calculateMonthlyProduction: (systemPower, month) => {
    const seasonalFactors = [0.914, 0.93, 0.935, 0.886, 0.898, 1.016, 1.025, 1.141, 1.131, 1.101, 1.071, 0.953];
    const baseProduction = 107.88; // kWh/kWp/mês para Manaus
    
    const factor = month ? seasonalFactors[month - 1] : 
      seasonalFactors.reduce((a, b) => a + b, 0) / 12;
    
    return systemPower * baseProduction * factor;
  },
  
  // Calculate economy
  calculateEconomy: (production, tariff) => {
    return production * tariff;
  }
};

export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatPhone,
  formatDocument,
  validateCPF,
  validateCNPJ,
  validateEmail,
  formatDate,
  daysBetween,
  isExpired,
  generateSlug,
  truncateText,
  debounce,
  copyToClipboard,
  downloadFile,
  getFileExtension,
  generateId,
  storage,
  isMobile,
  getUserLocation,
  solarCalculations,
};
