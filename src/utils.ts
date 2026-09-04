/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, ReceiptFontFamily, ReceiptPaperSizePreset, ReceiptLabels, CustomLabel, CustomLabelPosition, CustomImportedFont, Receipt } from './types';

export const DEFAULT_RECEIPT_LABELS: Required<ReceiptLabels> = {
  transactionIdLabel: 'No. Bon:',
  dateTimeLabel: 'Tanggal:',
  cashierLabel: 'Kasir:',
  customerLabel: 'Pelanggan:',
  subtotalLabel: 'SUBTOTAL:',
  discountLabel: 'DISKON',
  itemDiscountLabel: 'DISKON BARANG:',
  taxLabel: 'PAJAK / PPN',
  totalLabel: 'TOTAL AKHIR:',
  paymentMethodLabel: 'METODE BAYAR:',
  paymentStatusLabel: 'STATUS PELUNASAN:',
  cashReceivedLabel: 'BAYAR TUNAI:',
  changeAmountLabel: 'KEMBALIAN:',
};

export interface LabelPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  labels: Required<ReceiptLabels>;
}

export const LABEL_PRESETS: LabelPreset[] = [
  {
    id: 'DEFAULT',
    name: 'Standar Indonesia (Default)',
    badge: '🇮🇩 Retail / Kasir',
    description: 'Format bahasa Indonesia standar minimarket, swalayan, dan toko retail.',
    labels: { ...DEFAULT_RECEIPT_LABELS },
  },
  {
    id: 'ENGLISH',
    name: 'English POS Standard',
    badge: '🇬🇧 Global / English',
    description: 'Standard English thermal receipt format for international POS and tourists.',
    labels: {
      transactionIdLabel: 'Receipt #:',
      dateTimeLabel: 'Date / Time:',
      cashierLabel: 'Cashier:',
      customerLabel: 'Customer:',
      subtotalLabel: 'SUBTOTAL:',
      discountLabel: 'DISCOUNT',
      itemDiscountLabel: 'ITEM DISCOUNT:',
      taxLabel: 'TAX / VAT',
      totalLabel: 'GRAND TOTAL:',
      paymentMethodLabel: 'PAYMENT METHOD:',
      paymentStatusLabel: 'PAYMENT STATUS:',
      cashReceivedLabel: 'CASH TENDERED:',
      changeAmountLabel: 'CHANGE DUE:',
    },
  },
  {
    id: 'CAFE_RESTO',
    name: 'Kafe, Resto & F&B',
    badge: '☕ Kafe & Restoran',
    description: 'Format struk makanan & minuman: No. Pesanan, Server, PB1, Total Tagihan.',
    labels: {
      transactionIdLabel: 'No. Pesanan:',
      dateTimeLabel: 'Waktu Order:',
      cashierLabel: 'Server / Kasir:',
      customerLabel: 'Nama Tamu:',
      subtotalLabel: 'Sub Total Makanan:',
      discountLabel: 'Potongan Promo',
      itemDiscountLabel: 'Diskon Menu:',
      taxLabel: 'PB1 / Pajak Resto',
      totalLabel: 'TOTAL TAGIHAN:',
      paymentMethodLabel: 'Cara Bayar:',
      paymentStatusLabel: 'Status Tagihan:',
      cashReceivedLabel: 'Uang Diterima:',
      changeAmountLabel: 'Uang Kembali:',
    },
  },
  {
    id: 'FORMAL_INVOICE',
    name: 'Faktur / Nota Formal',
    badge: '🏢 Faktur & Nota',
    description: 'Format nota resmi perusahaan: No. Faktur, Petugas, PPN 11%, Jumlah Bersih.',
    labels: {
      transactionIdLabel: 'No. Faktur:',
      dateTimeLabel: 'Tgl Transaksi:',
      cashierLabel: 'Petugas / Admin:',
      customerLabel: 'Nama Klien / Pembeli:',
      subtotalLabel: 'Jumlah Kotor (Gross):',
      discountLabel: 'Potongan / Rabatt',
      itemDiscountLabel: 'Potongan Item:',
      taxLabel: 'PPN (Pajak Pertambahan Nilai)',
      totalLabel: 'JUMLAH BERSIH (NETTO):',
      paymentMethodLabel: 'Metode Pembayaran:',
      paymentStatusLabel: 'Status Pembayaran:',
      cashReceivedLabel: 'Jumlah Dibayar:',
      changeAmountLabel: 'Sisa Kembalian:',
    },
  },
];

export interface SuggestedCustomLabel {
  label: string;
  value: string;
  position: CustomLabelPosition;
  isBold?: boolean;
  category: string;
}

export const SUGGESTED_CUSTOM_LABELS: SuggestedCustomLabel[] = [
  { label: 'No. Meja', value: 'Meja 08 (Area Outdoor)', position: 'META', isBold: true, category: '🍽️ F&B / Kafe' },
  { label: 'No. Antrean', value: 'A-042', position: 'HEADER', isBold: true, category: '🎟️ Antrean' },
  { label: 'Tipe Pesanan', value: 'Dine In (Makan di Tempat)', position: 'META', isBold: false, category: '🍽️ F&B / Kafe' },
  { label: 'Plat Nomor', value: 'B 1234 XYZ', position: 'META', isBold: true, category: '🚗 Bengkel / Parkir' },
  { label: 'Poin Member', value: '+150 Poin (Total: 1.250)', position: 'ITEMS_SUMMARY', isBold: false, category: '⭐ Loyalty' },
  { label: 'Driver Ojol', value: 'Gojek - Slamet (GK-992)', position: 'META', isBold: false, category: '🛵 Delivery' },
  { label: 'Shift Kerja', value: 'Shift 1 (Pagi)', position: 'META', isBold: false, category: '💼 Operasional' },
  { label: 'NPWP Toko', value: '01.234.567.8-901.000', position: 'HEADER', isBold: false, category: '🏢 Pajak & Usaha' },
  { label: 'Garansi Produk', value: 'Garansi Toko 7 Hari (Simpan Struk)', position: 'FOOTER', isBold: false, category: '🛡️ Garansi' },
  { label: 'Catatan Pesanan', value: 'Less sugar, es dipisah', position: 'ITEMS_SUMMARY', isBold: false, category: '📝 Catatan' },
];

export function getReceiptLabels(labels?: ReceiptLabels): Required<ReceiptLabels> {
  return {
    transactionIdLabel: labels?.transactionIdLabel?.trim() || DEFAULT_RECEIPT_LABELS.transactionIdLabel,
    dateTimeLabel: labels?.dateTimeLabel?.trim() || DEFAULT_RECEIPT_LABELS.dateTimeLabel,
    cashierLabel: labels?.cashierLabel?.trim() || DEFAULT_RECEIPT_LABELS.cashierLabel,
    customerLabel: labels?.customerLabel?.trim() || DEFAULT_RECEIPT_LABELS.customerLabel,
    subtotalLabel: labels?.subtotalLabel?.trim() || DEFAULT_RECEIPT_LABELS.subtotalLabel,
    discountLabel: labels?.discountLabel?.trim() || DEFAULT_RECEIPT_LABELS.discountLabel,
    itemDiscountLabel: labels?.itemDiscountLabel?.trim() || DEFAULT_RECEIPT_LABELS.itemDiscountLabel,
    taxLabel: labels?.taxLabel?.trim() || DEFAULT_RECEIPT_LABELS.taxLabel,
    totalLabel: labels?.totalLabel?.trim() || DEFAULT_RECEIPT_LABELS.totalLabel,
    paymentMethodLabel: labels?.paymentMethodLabel?.trim() || DEFAULT_RECEIPT_LABELS.paymentMethodLabel,
    paymentStatusLabel: labels?.paymentStatusLabel?.trim() || DEFAULT_RECEIPT_LABELS.paymentStatusLabel,
    cashReceivedLabel: labels?.cashReceivedLabel?.trim() || DEFAULT_RECEIPT_LABELS.cashReceivedLabel,
    changeAmountLabel: labels?.changeAmountLabel?.trim() || DEFAULT_RECEIPT_LABELS.changeAmountLabel,
  };
}

export interface ReceiptFontOption {
  id: ReceiptFontFamily;
  name: string;
  category: 'EAS' | 'DEFAULT' | 'DOT MATRIX' | 'CLASSIC' | 'MODERN' | 'CUSTOM' | string;
  fontFamilyCss: string;
  className: string;
  description: string;
  sampleText: string;
  isCustom?: boolean;
  customFontData?: CustomImportedFont;
}

export interface PaperSizeOption {
  id: ReceiptPaperSizePreset;
  name: string;
  widthMm: number;
  description: string;
  tag: string;
  printableChars: string;
}

export const CUSTOM_FONTS_STORAGE_KEY = 'strukku_custom_imported_fonts';

/**
 * Loads custom imported TTF/OTF fonts from localStorage
 */
export function loadCustomFontsFromStorage(): CustomImportedFont[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load custom fonts from storage:', e);
  }
  return [];
}

/**
 * Saves custom imported fonts list to localStorage
 */
export function saveCustomFontsToStorage(fonts: CustomImportedFont[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(fonts));
  } catch (e) {
    console.error('Failed to save custom fonts to storage:', e);
  }
}

/**
 * Dynamically registers custom TTF/OTF fonts into DOM and document.fonts FontFace set
 */
export function registerCustomFontsInDocument(fonts: CustomImportedFont[]): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  
  try {
    let styleEl = document.getElementById('strukku-custom-fonts-style') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'strukku-custom-fonts-style';
      document.head.appendChild(styleEl);
    }

    if (!fonts || fonts.length === 0) {
      styleEl.textContent = '';
      return;
    }

    let cssRules = '';
    for (const font of fonts) {
      const formatString = font.format === 'otf' ? 'opentype' : 'truetype';
      cssRules += `
@font-face {
  font-family: "${font.name}";
  src: url("${font.dataUrl}") format("${formatString}");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "${font.name}";
  src: url("${font.dataUrl}") format("${formatString}");
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}
`;
      // Also register via FontFace API if supported
      if ('FontFace' in window && document.fonts) {
        try {
          const fontFace = new FontFace(font.name, `url(${font.dataUrl})`, {
            weight: 'normal',
            style: 'normal',
          });
          fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
          }).catch((err) => {
            console.warn(`FontFace load warn for ${font.name}:`, err);
          });
        } catch (e) {
          // Ignore FontFace API constructor errors
        }
      }
    }

    styleEl.textContent = cssRules;
  } catch (err) {
    console.error('Failed to register custom fonts in document:', err);
  }
}

export const PAPER_SIZE_OPTIONS: PaperSizeOption[] = [
  {
    id: '58mm',
    name: '58 mm (Mini Bluetooth / EDC)',
    widthMm: 58,
    description: 'Printer bluetooth portable, EDC perbankan, kasir mobile Moka/GoBiz/GrabFood.',
    tag: '58mm Mini',
    printableChars: '~32 karakter per baris',
  },
  {
    id: '80mm',
    name: '80 mm (Standar Desktop Kasir)',
    widthMm: 80,
    description: 'Ukuran standar minimarket (Indomaret/Alfamart), restoran & swalayan (Epson TM-T82).',
    tag: '80mm Standar',
    printableChars: '~48 karakter per baris',
  },
  {
    id: '76mm',
    name: '76 mm (Dot Matrix / Pita Jarum)',
    widthMm: 76,
    description: 'Printer pita dot-matrix kertas rangkap / NCR kasir konvensional (Epson TM-U220).',
    tag: '76mm Matrix',
    printableChars: '~40 karakter per baris',
  },
  {
    id: '100mm',
    name: '100 mm (Struk Lebar & Faktur)',
    widthMm: 100,
    description: 'Faktur penjualan lengkap, invoice toko grosir, atau label pengiriman ekspedisi.',
    tag: '100mm Lebar',
    printableChars: '~60+ karakter per baris',
  },
  {
    id: 'CUSTOM',
    name: 'Kustom mm (Bebas Atur)',
    widthMm: 80,
    description: 'Atur lebar kertas spesifik (40 mm s/d 210 mm) sesuai ukuran printer thermal Anda.',
    tag: 'Kustom mm',
    printableChars: 'Fleksibel',
  },
];

export function getPaperWidthMm(preset?: ReceiptPaperSizePreset, customMm?: number): number {
  if (customMm && customMm >= 40 && customMm <= 250) {
    return customMm;
  }
  if (preset && preset !== 'CUSTOM') {
    const found = PAPER_SIZE_OPTIONS.find((p) => p.id === preset);
    if (found) return found.widthMm;
  }
  return 80; // default standard 80mm
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

export function getFontFamilyCss(fontId?: ReceiptFontFamily, customFonts?: CustomImportedFont[]): string {
  if (!fontId) return RECEIPT_FONTS[0].fontFamilyCss;
  const found = RECEIPT_FONTS.find((f) => f.id === fontId);
  if (found) return found.fontFamilyCss;

  // Search in custom imported fonts
  const fontsList = customFonts || loadCustomFontsFromStorage();
  const customFound = fontsList.find((f) => f.id === fontId || f.name === fontId);
  if (customFound) {
    return `"${customFound.name}", "JetBrains Mono", ui-monospace, monospace`;
  }

  // If fontId itself looks like a direct font family name
  if (fontId && fontId !== 'DEFAULT') {
    return `"${fontId}", "JetBrains Mono", ui-monospace, monospace`;
  }

  return RECEIPT_FONTS[0].fontFamilyCss;
}

export function getFontClassName(fontId?: ReceiptFontFamily): string {
  const found = RECEIPT_FONTS.find((f) => f.id === fontId);
  return found ? found.className : 'font-receipt-default';
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

/**
 * Exports a list of receipts into a clean, Excel-compatible CSV file with UTF-8 BOM.
 * Formats numbers, dates, and item breakdowns cleanly for spreadsheet analysis.
 */
export function exportReceiptsToCSV(
  receipts: Receipt[],
  filenamePrefix = 'Strukku_Transaksi_Ledger'
): boolean {
  if (!receipts || receipts.length === 0) return false;

  const headers = [
    'No',
    'ID Transaksi',
    'Tanggal & Waktu',
    'Nama Toko',
    'Alamat Toko',
    'Telepon Toko',
    'Kasir',
    'Nama Pelanggan',
    'Metode Pembayaran',
    'Status Pembayaran',
    'Total Item (Qty)',
    'Rincian Item & Harga',
    'Subtotal',
    'Diskon',
    'Pajak / PPN',
    'Total Akhir',
    'Tunai Diterima',
    'Kembalian',
    'Catatan / Footer',
    'Status Arsip'
  ];

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = receipts.map((r, index) => {
    const totalQty = (r.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    const itemsDetail = (r.items || [])
      .map((item) => {
        const disc = item.discountRate ? ` [Diskon ${item.discountRate}%]` : '';
        return `${item.name} (${item.quantity}x @${item.price}${disc})`;
      })
      .join('; ');

    let paymentStatusLabel = 'Lunas';
    if (r.paymentStatus === 'BELUM_LUNAS') paymentStatusLabel = 'Belum Lunas';
    else if (r.paymentStatus === 'HUTANG') paymentStatusLabel = 'Hutang / Bon';

    return [
      escapeCSV(index + 1),
      escapeCSV(r.transactionId),
      escapeCSV(formatDateTime(r.dateTime)),
      escapeCSV(r.storeName || '-'),
      escapeCSV(r.storeAddress || '-'),
      escapeCSV(r.storePhone || '-'),
      escapeCSV(r.cashierName || '-'),
      escapeCSV(r.customerName || '-'),
      escapeCSV(r.paymentMethod || '-'),
      escapeCSV(paymentStatusLabel),
      escapeCSV(totalQty),
      escapeCSV(itemsDetail),
      escapeCSV(r.subtotal ?? 0),
      escapeCSV(r.discountAmount ?? 0),
      escapeCSV(r.taxAmount ?? 0),
      escapeCSV(r.total ?? 0),
      escapeCSV(r.cashReceived ?? 0),
      escapeCSV(r.changeAmount ?? 0),
      escapeCSV(r.notesFooter || '-'),
      escapeCSV(r.isArchived ? 'Diarsipkan' : 'Aktif')
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Microsoft Excel properly renders Indonesian characters, accents, and symbols
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  downloadLink.setAttribute('href', url);
  downloadLink.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
  return true;
}

