export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatAccountNumber(num: string): string {
  return num.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function generateReference(prefix = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateAccountNumber(): string {
  // 10-digit account number
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

export function maskCardNumber(num: string): string {
  if (num.length < 4) return num;
  return `•••• •••• •••• ${num.slice(-4)}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}
