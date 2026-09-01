/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, ReceiptFontFamily } from './types';

export interface ReceiptFontOption {
  id: ReceiptFontFamily;
  name: string;
  category: 'EAS' | 'DEFAULT' | 'DOT MATRIX' | 'CLASSIC' | 'MODERN';
  fontFamilyCss: string;
  className: string;
  description: string;
  sampleText: string;
}

export const RECEIPT_FONTS: ReceiptFontOption[] = [
  {
    id: 'DEFAULT',
    name: 'Default (JetBrains Mono)',
    category: 'DEFAULT',
    fontFamilyCss: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    className: 'font-receipt-default',
    description: 'Font default bawaan struk thermal, sangat tajam, presisi, dan mudah dibaca.',
    sampleText: '12345 TOTAL Rp 50.000',
  },
  {
    id: 'EAS',
    name: 'EAS Font Pack (Share Tech Mono)',
    category: 'EAS',
    fontFamilyCss: '"Share Tech Mono", ui-monospace, monospace',
    className: 'font-receipt-eas',
    description: 'Karakteristik khas Emergency Alert System (EAS) & radio cuaca dengan sudut tajam industrial.',
    sampleText: 'EMERGENCY ALERT TOTAL Rp 50.000',
  },
  {
    id: 'RETRO_TERMINAL',
    name: 'Retro Terminal / CRT (VT323)',
    category: 'EAS',
    fontFamilyCss: '"VT323", monospace',
    className: 'font-receipt-retro',
    description: 'Gaya layar terminal vintage 8-bit & monitor amber/hijau retro POS.',
    sampleText: '8-BIT POS TERMINAL 50.000',
  },
  {
    id: 'DOT_MATRIX',
    name: 'Dot Matrix 9-Pin (DotGothic16)',
    category: 'DOT MATRIX',
    fontFamilyCss: '"DotGothic16", monospace',
    className: 'font-receipt-dotmatrix',
    description: 'Tekstur titik jarum pita printer kasir minimarket asli (Epson/Star POS).',
    sampleText: 'DOT MATRIX POS 50.000',
  },
  {
    id: 'SPACE_MONO',
    name: 'Space Mono (Mechanical POS)',
    category: 'CLASSIC',
    fontFamilyCss: '"Space Mono", monospace',
    className: 'font-receipt-spacemono',
    description: 'Huruf mekanikal retro futuristik dengan gaya geometric monospace.',
    sampleText: 'MECHANICAL 12345 Rp 50.000',
  },
  {
    id: 'COURIER',
    name: 'Courier Prime (Mesin Tik Kasir)',
    category: 'CLASSIC',
    fontFamilyCss: '"Courier Prime", "Courier New", Courier, monospace',
    className: 'font-receipt-courier',
    description: 'Gaya register kasir mesin tik manual klasik & nota vintage tradisional.',
    sampleText: 'TYPEWRITER CASH Rp 50.000',
  },
  {
    id: 'INCONSOLATA',
    name: 'Inconsolata (Compact POS)',
    category: 'CLASSIC',
    fontFamilyCss: '"Inconsolata", monospace',
    className: 'font-receipt-inconsolata',
    description: 'Monospace ramping dan hemat ruang kertas untuk struk panjang.',
    sampleText: 'COMPACT POS 12345 Rp 50.000',
  },
  {
    id: 'ROBOTO_MONO',
    name: 'Roboto Mono',
    category: 'CLASSIC',
    fontFamilyCss: '"Roboto Mono", monospace',
    className: 'font-receipt-robotomono',
    description: 'Monospace standar modern dengan proporsi angka yang seimbang.',
    sampleText: 'ROBOTO MONO 12345 Rp 50.000',
  },
  {
    id: 'MODERN_SANS',
    name: 'Modern Clean Sans (Jakarta)',
    category: 'MODERN',
    fontFamilyCss: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
    className: 'font-receipt-modern',
    description: 'Gaya kafe modern, butik, dan invoice digital kekinian yang rapi.',
    sampleText: 'Modern Cafe Receipt Rp 50.000',
  },
];

export function getFontFamilyCss(fontId?: ReceiptFontFamily): string {
  const found = RECEIPT_FONTS.find((f) => f.id === fontId);
  return found ? found.fontFamilyCss : RECEIPT_FONTS[0].fontFamilyCss;
}

export function getFontClassName(fontId?: ReceiptFontFamily): string {
  const found = RECEIPT_FONTS.find((f) => f.id === fontId);
  return found ? found.className : RECEIPT_FONTS[0].className;
}

/**
 * Formats a number into a currency string (defaulting to Indonesian Rupiah)
 */
export function formatCurrency(amount: number, symbol: string = 'Rp'): string {
  const formatted = Math.abs(amount)
    .toFixed(0) // Indonesian Rupiah usually has no decimals
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // dot as thousands separator

  const prefix = amount < 0 ? '-' : '';
  
  if (symbol === 'Rp') {
    return `${prefix}${symbol} ${formatted}`;
  } else if (symbol === '$' || symbol === '£' || symbol === '€') {
    // For Western currencies, use standard format with decimals
    const westernFormatted = amount.toLocaleString('en-US', {
      style: 'currency',
      currency: symbol === '$' ? 'USD' : symbol === '£' ? 'GBP' : 'EUR',
    });
    return westernFormatted;
  }
  
  return `${prefix}${symbol} ${formatted}`;
}

/**
 * Generates a random realistic transaction ID resembling minimarket codes
 * E.g., AD-98124/TRX/06/2026
 */
export function generateTransactionId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  return `${prefix}-${randNum}/TRX/${month}/${year}`;
}

/**
 * Formats full datetime for human reading or print
 */
export function formatDateTime(dateTimeString: string): string {
  if (!dateTimeString) return '';
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) return dateTimeString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Helper to calculate subtotal, tax, discount, and total for a receipt
 */
export function calculateTotals(
  items: Item[],
  taxRate: number, // percentage, e.g. 11
  discountRate: number, // value or percentage for total transaction
  discountType: 'PERCENT' | 'FIXED'
) {
  // Gross subtotal before any discounts
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate individual item-level discounts
  const itemDiscountTotal = items.reduce((sum, item) => {
    const itemRate = item.discountRate || 0;
    const itemTotal = item.price * item.quantity;
    return sum + Math.round(itemTotal * (itemRate / 100));
  }, 0);
  
  // Subtotal after item-level discounts
  const netSubtotal = Math.max(0, subtotal - itemDiscountTotal);
  
  // Calculate transaction-level discount
  let transactionDiscountAmount = 0;
  if (discountType === 'PERCENT') {
    transactionDiscountAmount = Math.round(netSubtotal * (discountRate / 100));
  } else {
    transactionDiscountAmount = discountRate;
  }
  
  // Ensure total transaction discount does not exceed the net subtotal
  transactionDiscountAmount = Math.min(transactionDiscountAmount, netSubtotal);
  
  // Apply transaction discount to get taxable amount
  const taxableAmount = Math.max(0, netSubtotal - transactionDiscountAmount);
  const taxAmount = Math.round(taxableAmount * (taxRate / 100));
  
  const total = taxableAmount + taxAmount;
  const totalDiscountAmount = itemDiscountTotal + transactionDiscountAmount;
  
  return {
    subtotal, // Gross subtotal before discount
    itemDiscountTotal,
    transactionDiscountAmount,
    discountAmount: Math.min(totalDiscountAmount, subtotal),
    taxAmount,
    total: Math.max(0, total),
  };
}
