/**
 * Input Masks and Validation Utilities
 * Professional-grade input formatting
 */

/**
 * Formata telefone brasileiro
 * Aceita: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limited = numbers.substring(0, 11);
  
  // Formata baseado no tamanho
  if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
};

/**
 * Valida email
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return true; // Email é opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida telefone brasileiro
 */
export const isValidPhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length === 10 || numbers.length === 11;
};

/**
 * Parse serviços de string para array
 * Aceita vírgula, ponto-e-vírgula ou quebra de linha
 */
export const parseServices = (input: string): string[] => {
  if (!input.trim()) return [];
  
  return input
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 10); // Máximo 10 serviços
};

/**
 * Formata array de serviços para exibição
 */
export const formatServices = (services: string[]): string => {
  return services.join(', ');
};

/**
 * Valida lista de serviços
 */
export const isValidServices = (services: string[]): boolean => {
  return services.length >= 1 && services.length <= 10;
};
