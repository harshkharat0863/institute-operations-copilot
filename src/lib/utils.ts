/**
 * Mask a phone number to always conceal private digits.
 * Input: "9876543210" -> Output: "98******10"
 * Input: "+91 98765 43210" -> Output: "+91 98*** **210"
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '—';
  // Strip non-digits to analyze length
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '******';
  const prefix = digits.slice(0, 2);
  const suffix = digits.slice(-2);
  const stars = '*'.repeat(Math.max(4, digits.length - 4));
  return `${prefix}${stars}${suffix}`;
}

/**
 * Format currency in Indian Rupees (₹)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date string into human readable format (e.g., 18 Oct 2026)
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format timestamp into date + time (e.g. Oct 18, 10:30 AM)
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
