/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentMethod = 'CASH' | 'DEBIT' | 'CREDIT' | 'QRIS' | 'E-WALLET';
export type PaymentStatus = 'SUDAH_LUNAS' | 'BELUM_LUNAS' | 'HUTANG';
export type CodeDisplayType = 'QR' | 'BARCODE' | 'BOTH' | 'NONE';
export type ReceiptFontFamily = 
  | 'DEFAULT'          // JetBrains Mono (Thermal Standard)
  | 'EAS'              // Share Tech Mono (EAS Font Pack / Alert System)
  | 'RETRO_TERMINAL'   // VT323 (Retro 8-bit / EAS Terminal)
  | 'DOT_MATRIX'       // DotGothic16 (Dot Matrix 9-pin POS)
  | 'SPACE_MONO'       // Space Mono (Mechanical Retro)
  | 'COURIER'          // Courier Prime (Classic Cash Register)
  | 'INCONSOLATA'      // Inconsolata (Clean Compact POS)
  | 'ROBOTO_MONO'      // Roboto Mono (Modern Monospace)
  | 'MODERN_SANS';     // Plus Jakarta Sans (Modern Clean Retail)

export interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number; // Unit price
  discountRate?: number; // item-level percentage-based discount, e.g. 10 for 10%
}

export interface Receipt {
  id: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeWebsite: string;
  cashierName: string;
  customerName?: string;
  transactionId: string;
  dateTime: string;
  items: Item[];
  taxRate: number; // percentage
  taxAmount: number;
  discountRate: number; // percentage or fixed value
  discountType: 'PERCENT' | 'FIXED';
  discountAmount: number; // calculated total discount
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashReceived: number;
  changeAmount: number;
  notesHeader: string;
  notesFooter: string;
  logoUrl?: string; // custom base64 or URL
  logoType?: 'NONE' | 'INDOMARET' | 'ALFAMART' | 'OSAVE' | 'CUSTOM';
  codeDisplayType?: CodeDisplayType;
  qrValue?: string;
  qrLabel?: string;
  qrSize?: number;
  barcodeValue?: string;
  showBarcodeNumber?: boolean;
  fontFamily?: ReceiptFontFamily;
}

export interface StoreProfile {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeWebsite: string;
  cashierName: string;
  customerName?: string;
  taxRate: number;
  discountRate: number;
  discountType: 'PERCENT' | 'FIXED';
  notesHeader: string;
  notesFooter: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  logoUrl?: string;
  logoType?: 'NONE' | 'INDOMARET' | 'ALFAMART' | 'OSAVE' | 'CUSTOM';
  codeDisplayType?: CodeDisplayType;
  qrValue?: string;
  qrLabel?: string;
  qrSize?: number;
  barcodeValue?: string;
  showBarcodeNumber?: boolean;
  fontFamily?: ReceiptFontFamily;
}
