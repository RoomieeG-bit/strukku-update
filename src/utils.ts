/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item } from './types';

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
