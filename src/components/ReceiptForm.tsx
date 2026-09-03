/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Item, PaymentMethod, PaymentStatus, CodeDisplayType, ReceiptFontFamily, ReceiptPaperSizePreset, ReceiptLabels, CustomLabel, CustomLabelPosition, CustomImportedFont } from '../types';
import { generateTransactionId, calculateTotals, formatCurrency, RECEIPT_FONTS, PAPER_SIZE_OPTIONS, getPaperWidthMm, LABEL_PRESETS, SUGGESTED_CUSTOM_LABELS, DEFAULT_RECEIPT_LABELS, getReceiptLabels, loadCustomFontsFromStorage, saveCustomFontsToStorage, registerCustomFontsInDocument, getFontFamilyCss } from '../utils';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Store, 
  User, 
  Hash, 
  Calendar, 
  Plus, 
  Minus,
  Trash2, 
  Percent, 
  DollarSign, 
  FileText, 
  ShoppingBag, 
  RefreshCw, 
  Clock, 
  Sparkles,
  Layers,
  PlusCircle,
  CheckCircle,
  QrCode,
  Link as LinkIcon,
  Globe,
  Phone,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Sliders,
  Barcode,
  CreditCard,
  Type,
  RotateCcw,
  Zap,
  CheckCircle2,
  Info,
  Maximize2,
  Printer,
  Tag,
  Bookmark,
  Edit3,
  HelpCircle,
  Upload,
  FileUp,
  AlertTriangle,
  FolderUp,
  FileCheck
} from 'lucide-react';

interface ReceiptFormProps {
  receipt: Receipt;
  onUpdateReceipt: (receipt: Receipt) => void;
  onSaveReceipt: () => void;
  onNewReceipt: () => void;
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
}

// Preset Quick-Add Items for super easy POS simulation
const QUICK_ITEMS = [
  { name: 'Kopi Susu Gula Aren', price: 18000 },
  { name: 'Roti Bakar Cokelat', price: 15000 },
  { name: 'Indomie Goreng Jumbo', price: 6000 },
  { name: 'Teh Botol Sosro 450ml', price: 5000 },
  { name: 'Aqua Air Mineral 600ml', price: 4000 },
  { name: 'Susu UHT Ultra 250ml', price: 7000 },
  { name: 'Ciki Chiki Balls Keju', price: 8500 },
  { name: 'Pocari Sweat 500ml', price: 9000 },
];

// Indonesian Minimarket and Cafe presets
const PRESETS = [
  {
    name: 'Indomaret Style',
    storeName: 'INDOMARET CIPUTE',
    storeAddress: 'Jl. Raya Ciputat No. 42, Tangerang Selatan',
    storePhone: '021-7401234',
    storeWebsite: 'www.indomaret.co.id',
    cashierName: 'Andi Wijaya',
    notesHeader: 'PT. INDOMARCO PRISMATAMA',
    notesFooter: 'TERIMA KASIH\nSELAMAT BELANJA KEMBALI\nLAYANAN KONSUMEN: 1500-280',
    taxRate: 11, // Standard PPN 11%
    discountRate: 0,
    discountType: 'PERCENT' as const,
    logoType: 'INDOMARET' as const,
    items: [
      { id: '1', name: 'Aqua Air Mineral 600ml', quantity: 2, price: 4000 },
      { id: '2', name: 'Indomie Goreng Jumbo', quantity: 5, price: 6000 },
      { id: '3', name: 'Susu UHT Ultra 250ml', quantity: 3, price: 7000 },
    ],
  },
  {
    name: 'Alfamart Style',
    storeName: 'ALFAMART KEMANG 2',
    storeAddress: 'Jl. Kemang Raya No. 10B, Jakarta Selatan',
    storePhone: '021-7195432',
    storeWebsite: 'www.alfamart.co.id',
    cashierName: 'Siti Rahma',
    notesHeader: 'PT. SUMBER ALFARIA TRIJAYA',
    notesFooter: 'STRUK RESMI ALFAMART\nTERIMA KASIH - SELAMAT BELANJA\nKRITIK/SARAN: 1500-959',
    taxRate: 11,
    discountRate: 5000,
    discountType: 'FIXED' as const,
    logoType: 'ALFAMART' as const,
    items: [
      { id: '1', name: 'Pocari Sweat 500ml', quantity: 2, price: 9000 },
      { id: '2', name: 'Ciki Chiki Balls Keju', quantity: 4, price: 8500 },
    ],
  },
  {
    name: 'o!save Style',
    storeName: 'O!SAVE BEKASI TIMUR',
    storeAddress: 'Jl. Joyo Martono No. 88, Bekasi Timur',
    storePhone: '021-82412345',
    storeWebsite: 'www.osave.co.id',
    cashierName: 'Yusuf Kurniawan',
    notesHeader: 'PT. SERASI RETAIL INDONESIA',
    notesFooter: 'TERIMA KASIH\nSELAMAT BELANJA KEMBALI\no!save - PILIHAN PINTAR BELANJA HEMAT',
    taxRate: 11,
    discountRate: 2000,
    discountType: 'FIXED' as const,
    logoType: 'OSAVE' as const,
    items: [
      { id: '1', name: 'Minyak Goreng SunCo 2L', quantity: 1, price: 34500 },
      { id: '2', name: 'Gula Pasir Gulaku 1kg', quantity: 2, price: 16000 },
      { id: '3', name: 'Beras Premium SPHP 5kg', quantity: 1, price: 69500, discountRate: 5 },
    ],
  },
  {
    name: 'Kopi Kenangan Style',
    storeName: 'KOPI SENJA ABADI',
    storeAddress: 'Mall Kelapa Gading 3, Lt. Dasar, Jakarta',
    storePhone: '0812-3456-7890',
    storeWebsite: 'www.kopisenjaabadi.com',
    cashierName: 'Rian Pratama',
    notesHeader: 'NONGKRONG NYAMAN SETIAP HARI',
    notesFooter: 'SUDAH TERMASUK TAX & SERVICE\nIG: @kopisenjaabadi\nWiFi: senjagratis / pwd: kopi',
    taxRate: 10,
    discountRate: 10, // 10% discount
    discountType: 'PERCENT' as const,
    logoType: 'NONE' as const,
    items: [
      { id: '1', name: 'Kopi Susu Gula Aren', quantity: 2, price: 18000 },
      { id: '2', name: 'Roti Bakar Cokelat', quantity: 1, price: 15000 },
    ],
  },
  {
    name: 'Warung Bu Joko',
    storeName: 'WARUNG KELONTONG BU JOKO',
    storeAddress: 'Gg. Masjid No. 7, RT 03/04, Kebayoran',
    storePhone: '0857-9999-8888',
    storeWebsite: '',
    cashierName: 'Bu Joko',
    notesHeader: 'SEDIA SEMBAKO & KEBUTUHAN HARIAN',
    notesFooter: 'TERIMA KASIH ATAS KUNJUNGAN ANDA\nBARANG YANG SUDAH DIBELI\nTIDAK DAPAT DITUKAR/DIKEMBALIKAN',
    taxRate: 0,
    discountRate: 0,
    discountType: 'PERCENT' as const,
    logoType: 'NONE' as const,
    items: [
      { id: '1', name: 'Aqua Air Mineral 600ml', quantity: 12, price: 3500 },
      { id: '2', name: 'Indomie Goreng Jumbo', quantity: 10, price: 5500 },
    ],
  }
];

export default function ReceiptForm({
  receipt,
  onUpdateReceipt,
  onSaveReceipt,
  onNewReceipt,
  currencySymbol,
  setCurrencySymbol,
}: ReceiptFormProps) {
  // Local state for adding a single item
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemDiscount, setNewItemDiscount] = useState(0);
  const [activeTab, setActiveTab] = useState<'store' | 'items' | 'payment' | 'size' | 'fonts' | 'labels' | 'code' | 'templates'>('store');
  const [labelSubTab, setLabelSubTab] = useState<'CUSTOM' | 'STANDARD' | 'PRESETS'>('CUSTOM');
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');
  const [newCustomPosition, setNewCustomPosition] = useState<CustomLabelPosition>('META');
  const [newCustomIsBold, setNewCustomIsBold] = useState(false);
  const [newCustomShowColon, setNewCustomShowColon] = useState(true);
  const [labelFeedbackMsg, setLabelFeedbackMsg] = useState('');
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>('ALL');
  const [customFontSampleText, setCustomFontSampleText] = useState<string>('');
  const [copiedQrContent, setCopiedQrContent] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [presetSuccessMsg, setPresetSuccessMsg] = useState('');
  const [customPresets, setCustomPresets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('strukku_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Custom Imported Fonts (.ttf / .otf)
  const [customFonts, setCustomFonts] = useState<CustomImportedFont[]>(() => {
    return loadCustomFontsFromStorage();
  });
  const [fontUploadError, setFontUploadError] = useState<string>('');
  const [fontUploadSuccess, setFontUploadSuccess] = useState<string>('');

  // Register custom fonts whenever customFonts list changes
  useEffect(() => {
    registerCustomFontsInDocument(customFonts);
  }, [customFonts]);

  // Clear font success message after 4 seconds
  useEffect(() => {
    if (fontUploadSuccess) {
      const timer = setTimeout(() => {
        setFontUploadSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [fontUploadSuccess]);

  // Clear font error message after 5 seconds
  useEffect(() => {
    if (fontUploadError) {
      const timer = setTimeout(() => {
        setFontUploadError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [fontUploadError]);

  // Handle importing custom .ttf or .otf font
  const handleImportCustomFont = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = '';
    setFontUploadError('');
    setFontUploadSuccess('');

    // Strict validation: Only .ttf and .otf files accepted
    const fileName = file.name || '';
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext !== 'ttf' && ext !== 'otf') {
      setFontUploadError('Format tidak didukung! Fitur "Impor Font Kustom" hanya menerima berkas font berekstensi .ttf dan .otf.');
      return;
    }

    // Check file size (cap at 6 MB to avoid memory pressure in localStorage)
    if (file.size > 6 * 1024 * 1024) {
      setFontUploadError('Ukuran file font terlalu besar (Maksimal 6 MB). Silakan gunakan font yang telah dioptimasi.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          setFontUploadError('Gagal membaca data berkas font.');
          return;
        }

        // Clean name from filename
        const rawBaseName = fileName.replace(/\.[^/.]+$/, '').trim();
        const cleanFontName = rawBaseName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, ' ').trim() || `CustomFont_${Date.now()}`;
        const fontId = `custom_font_${Date.now()}`;

        const newFont: CustomImportedFont = {
          id: fontId,
          name: cleanFontName,
          fileName: fileName,
          format: ext as 'ttf' | 'otf',
          dataUrl,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
        };

        const updatedList = [newFont, ...customFonts.filter(f => f.name.toLowerCase() !== cleanFontName.toLowerCase())];
        setCustomFonts(updatedList);
        saveCustomFontsToStorage(updatedList);
        registerCustomFontsInDocument(updatedList);

        // Automatically activate this newly imported font on current receipt
        handleRecalculate({ fontFamily: newFont.id });
        setFontUploadSuccess(`Font kustom "${cleanFontName}" (.${ext.toUpperCase()}) berhasil diimpor dan langsung aktif!`);
      } catch (err) {
        console.error('Error processing custom font file:', err);
        setFontUploadError('Terjadi kesalahan saat memproses berkas font.');
      }
    };

    reader.onerror = () => {
      setFontUploadError('Gagal memproses file font dari perangkat Anda.');
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteCustomFont = (fontId: string, fontName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const updatedList = customFonts.filter(f => f.id !== fontId);
    setCustomFonts(updatedList);
    saveCustomFontsToStorage(updatedList);
    registerCustomFontsInDocument(updatedList);

    // If deleted font was active on receipt, fallback to DEFAULT
    if (receipt.fontFamily === fontId || receipt.fontFamily === fontName) {
      handleRecalculate({ fontFamily: 'DEFAULT' });
    }

    setFontUploadSuccess(`Font "${fontName}" telah dihapus.`);
  };

  // Sync custom presets to localStorage
  useEffect(() => {
    localStorage.setItem('strukku_custom_presets', JSON.stringify(customPresets));
  }, [customPresets]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (presetSuccessMsg) {
      const timer = setTimeout(() => {
        setPresetSuccessMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [presetSuccessMsg]);

  // Clear label feedback message after 3 seconds
  useEffect(() => {
    if (labelFeedbackMsg) {
      const timer = setTimeout(() => {
        setLabelFeedbackMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [labelFeedbackMsg]);

  // Add current active receipt as preset
  const handleSaveAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (receipt.items.length === 0) {
      setPresetSuccessMsg('Error: Tambahkan setidaknya 1 item terlebih dahulu!');
      return;
    }
    const defaultPresetName = `Preset ${receipt.storeName || 'Toko Kustom'}`;
    const nameToUse = newPresetName.trim() || defaultPresetName;

    const newPreset = {
      name: nameToUse,
      storeName: receipt.storeName || 'Toko Kustom',
      storeAddress: receipt.storeAddress || '',
      storePhone: receipt.storePhone || '',
      storeWebsite: receipt.storeWebsite || '',
      cashierName: receipt.cashierName || '',
      notesHeader: receipt.notesHeader || '',
      notesFooter: receipt.notesFooter || '',
      taxRate: receipt.taxRate || 0,
      discountRate: receipt.discountRate || 0,
      discountType: receipt.discountType || 'PERCENT',
      logoType: receipt.logoType || 'NONE',
      items: receipt.items.map(item => ({ ...item })),
    };

    setCustomPresets(prev => [newPreset, ...prev]);
    setNewPresetName('');
    setPresetSuccessMsg('Sukses: Preset berhasil ditambahkan!');
  };

  const handleDeletePreset = (indexToDelete: number) => {
    setCustomPresets(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  // Trigger recalculation when items, tax, or discounts change
  const handleRecalculate = (updatedFields: Partial<Receipt>) => {
    const nextReceipt = { ...receipt, ...updatedFields };
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals(
      nextReceipt.items,
      nextReceipt.taxRate,
      nextReceipt.discountRate,
      nextReceipt.discountType
    );

    const changeAmount = nextReceipt.paymentMethod === 'CASH' 
      ? Math.max(0, nextReceipt.cashReceived - total)
      : 0;

    onUpdateReceipt({
      ...nextReceipt,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      changeAmount,
    });
  };

  // Preset Template Loader
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    const generatedTxId = generateTransactionId();
    const formattedNow = new Date().toISOString().slice(0, 16); // format to datetime-local standard
    
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals(
      preset.items,
      preset.taxRate,
      preset.discountRate,
      preset.discountType
    );

    onUpdateReceipt({
      ...receipt,
      storeName: preset.storeName,
      storeAddress: preset.storeAddress,
      storePhone: preset.storePhone,
      storeWebsite: preset.storeWebsite,
      cashierName: preset.cashierName,
      notesHeader: preset.notesHeader,
      notesFooter: preset.notesFooter,
      taxRate: preset.taxRate,
      discountRate: preset.discountRate,
      discountType: preset.discountType,
      items: preset.items,
      transactionId: generatedTxId,
      dateTime: formattedNow,
      subtotal,
      taxAmount,
      discountAmount,
      total,
      cashReceived: preset.taxRate === 0 && preset.discountRate === 0 ? 0 : total,
      changeAmount: 0,
      logoType: preset.logoType,
    });
  };

  // Add Item to List
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim() || newItemQty <= 0 || newItemPrice < 0) return;

    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      quantity: newItemQty,
      price: newItemPrice,
      discountRate: newItemDiscount > 0 ? newItemDiscount : undefined,
    };

    const updatedItems = [...receipt.items, newItem];
    handleRecalculate({ items: updatedItems });

    // Reset fields
    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice(0);
    setNewItemDiscount(0);
  };

  // Pre-fill fields when a Quick Add Item is clicked
  const handleQuickAddItem = (quickItem: { name: string; price: number }) => {
    setNewItemName(quickItem.name);
    setNewItemPrice(quickItem.price);
    setNewItemQty(1);
  };

  // Remove Item from List
  const handleRemoveItem = (id: string) => {
    const updatedItems = receipt.items.filter((item) => item.id !== id);
    handleRecalculate({ items: updatedItems });
  };

  // Update Item Property directly in the table
  const handleUpdateItemProperty = (id: string, property: keyof Item, value: any) => {
    const updatedItems = receipt.items.map((item) => {
      if (item.id === id) {
        return { ...item, [property]: value };
      }
      return item;
    });
    handleRecalculate({ items: updatedItems });
  };

  // Regenerate Transaction ID
  const handleRegenerateTxId = () => {
    handleRecalculate({ transactionId: generateTransactionId() });
  };

  // Set datetime to now
  const handleSetDateTimeNow = () => {
    const now = new Date();
    // Adjust to local datetime-local format
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - (offset * 60 * 1000));
    handleRecalculate({ dateTime: localNow.toISOString().slice(0, 16) });
  };

  // Label Handlers
  const handleAddCustomLabel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCustomLabel.trim() && !newCustomValue.trim()) {
      setLabelFeedbackMsg('Error: Mohon isi nama label atau nilai teks.');
      return;
    }
    const newField: CustomLabel = {
      id: 'lbl_' + Math.random().toString(36).substring(2, 9),
      label: newCustomLabel.trim(),
      value: newCustomValue.trim(),
      position: newCustomPosition,
      isBold: newCustomIsBold,
      showColon: newCustomShowColon,
    };
    const updatedCustom = [...(receipt.customLabels || []), newField];
    handleRecalculate({ customLabels: updatedCustom });
    setNewCustomLabel('');
    setNewCustomValue('');
    setLabelFeedbackMsg('Sukses: Label kustom baru berhasil ditambahkan ke struk!');
  };

  const handleAddSuggestedCustom = (sug: typeof SUGGESTED_CUSTOM_LABELS[0]) => {
    const newField: CustomLabel = {
      id: 'lbl_' + Math.random().toString(36).substring(2, 9),
      label: sug.label,
      value: sug.value,
      position: sug.position,
      isBold: sug.isBold || false,
      showColon: true,
    };
    const updatedCustom = [...(receipt.customLabels || []), newField];
    handleRecalculate({ customLabels: updatedCustom });
    setLabelFeedbackMsg(`Sukses: Label "${sug.label}" berhasil ditambahkan!`);
  };

  const handleRemoveCustomLabel = (id: string) => {
    const updated = (receipt.customLabels || []).filter(l => l.id !== id);
    handleRecalculate({ customLabels: updated });
    setLabelFeedbackMsg('Label kustom berhasil dihapus.');
  };

  const handleUpdateCustomLabel = (id: string, updates: Partial<CustomLabel>) => {
    const updated = (receipt.customLabels || []).map(l => l.id === id ? { ...l, ...updates } : l);
    handleRecalculate({ customLabels: updated });
  };

  const handleUpdateStandardLabel = (key: keyof ReceiptLabels, value: string) => {
    const updatedLabels = {
      ...(receipt.labels || {}),
      [key]: value,
    };
    handleRecalculate({ labels: updatedLabels });
  };

  const handleApplyLabelPreset = (preset: typeof LABEL_PRESETS[0]) => {
    handleRecalculate({
      labels: { ...preset.labels },
    });
    setLabelFeedbackMsg(`Sukses: Preset label "${preset.name}" berhasil diterapkan!`);
  };

  const handleResetStandardLabels = () => {
    handleRecalculate({
      labels: { ...DEFAULT_RECEIPT_LABELS },
    });
    setLabelFeedbackMsg('Sukses: Semua label standar dikembalikan ke teks bawaan!');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full" id="receipt-form-panel">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50/70 p-2 gap-1 shrink-0 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'store'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-store-info"
        >
          <Store className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Toko & Detail</span>
          <span className="md:hidden">Toko</span>
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'items'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-items"
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Daftar Barang</span>
          <span className="md:hidden">Barang</span>
          {receipt.items.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'items' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-850'
            }`}>
              {receipt.items.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'payment'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-payment"
        >
          <Percent className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Pembayaran & Pajak</span>
          <span className="md:hidden">Bayar</span>
        </button>
        <button
          onClick={() => setActiveTab('size')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'size'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-receipt-size"
        >
          <Maximize2 className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
          <span className="hidden md:inline">Ukuran Kertas</span>
          <span className="md:hidden">Ukuran</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
            activeTab === 'size' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-800'
          }`}>
            {getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm)}mm
          </span>
        </button>
        <button
          onClick={() => setActiveTab('fonts')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'fonts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-receipt-fonts"
        >
          <Type className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Ubah Font</span>
          <span className="md:hidden">Font</span>
          {receipt.fontFamily && receipt.fontFamily !== 'DEFAULT' && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('labels')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'labels'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-receipt-labels"
        >
          <Tag className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span className="hidden md:inline">Ubah Label</span>
          <span className="md:hidden">Label</span>
          {((receipt.customLabels && receipt.customLabels.length > 0) || (receipt.labels && Object.keys(receipt.labels).length > 0)) && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'labels' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-800'
            }`}>
              {(receipt.customLabels?.length || 0) + (receipt.labels ? Object.values(receipt.labels).filter(Boolean).length : 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'code'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-barcode-qr"
        >
          <QrCode className="w-3.5 h-3.5 shrink-0" />
          <span>Barcode & QR</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-presets"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Preset</span>
        </button>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* TAB 1: STORE INFO & METADATA */}
        {activeTab === 'store' && (
          <div className="space-y-4" id="form-section-store">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi Toko / Warung</h3>
            
            {/* Logo Configuration */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Logo Outlet Struk</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'NONE', label: 'Tanpa Logo' },
                    { id: 'INDOMARET', label: 'Indomaret' },
                    { id: 'ALFAMART', label: 'Alfamart' },
                    { id: 'OSAVE', label: 'o!save' },
                    { id: 'CUSTOM', label: 'Kustom Image' },
                  ].map((logoOption) => (
                    <button
                      key={logoOption.id}
                      type="button"
                      onClick={() => handleRecalculate({ logoType: logoOption.id as any })}
                      className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition text-center cursor-pointer ${
                        (receipt.logoType || 'NONE') === logoOption.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      {logoOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show file upload if logoType is 'CUSTOM' */}
              {receipt.logoType === 'CUSTOM' && (
                <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-white text-center">
                  <div className="text-xs font-semibold text-slate-700 mb-1">Import Gambar Logo (JPG / PNG)</div>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    id="logo-image-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          handleRecalculate({ 
                            logoUrl: event.target?.result as string,
                            logoType: 'CUSTOM' 
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {receipt.logoUrl ? (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <img 
                        src={receipt.logoUrl} 
                        alt="Logo Struk Kustom" 
                        className="max-h-12 object-contain rounded border border-slate-100 p-1" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex gap-1.5 justify-center">
                        <label 
                          htmlFor="logo-image-upload" 
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-bold cursor-pointer transition"
                        >
                          Ganti Gambar
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRecalculate({ logoUrl: undefined })}
                          className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1 rounded font-bold transition cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label 
                      htmlFor="logo-image-upload"
                      className="inline-block py-2 px-3 border border-slate-200 hover:border-slate-350 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 cursor-pointer transition"
                    >
                      Pilih File JPG / PNG
                    </label>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">Rekomendasi: Gunakan gambar berukuran sedang atau logo transparan monokrom.</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="store-name-input">Nama Toko</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Store className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="store-name-input"
                    value={receipt.storeName}
                    onChange={(e) => handleRecalculate({ storeName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    placeholder="Nama Minimarket / Cafe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="cashier-name-input">Nama Kasir</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="cashier-name-input"
                    value={receipt.cashierName}
                    onChange={(e) => handleRecalculate({ cashierName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    placeholder="Nama Kasir"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="customer-name-input">
                  Nama Pelanggan <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-indigo-400" />
                  </span>
                  <input
                    type="text"
                    id="customer-name-input"
                    value={receipt.customerName || ''}
                    onChange={(e) => handleRecalculate({ customerName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    placeholder="Nama Pelanggan"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="store-address-input">Alamat Toko</label>
                <input
                  type="text"
                  id="store-address-input"
                  value={receipt.storeAddress}
                  onChange={(e) => handleRecalculate({ storeAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                  placeholder="Jl. Raya Utama No. 123"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="store-phone-input">No. Telepon</label>
                <input
                  type="text"
                  id="store-phone-input"
                  value={receipt.storePhone}
                  onChange={(e) => handleRecalculate({ storePhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                  placeholder="021-XXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="store-website-input">Website Toko</label>
                <input
                  type="text"
                  id="store-website-input"
                  value={receipt.storeWebsite || ''}
                  onChange={(e) => handleRecalculate({ storeWebsite: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                  placeholder="www.toko.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="tx-id-input">ID Transaksi / Struk</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Hash className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      id="tx-id-input"
                      value={receipt.transactionId}
                      onChange={(e) => handleRecalculate({ transactionId: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-mono text-xs"
                      placeholder="TX-000000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateTxId}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-sm flex items-center gap-1 transition"
                    title="Generate Transaksi Baru"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="tx-date-input">Waktu Transaksi</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="datetime-local"
                      id="tx-date-input"
                      value={receipt.dateTime}
                      onChange={(e) => handleRecalculate({ dateTime: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSetDateTimeNow}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-sm flex items-center gap-1 transition"
                    title="Set ke Waktu Sekarang"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Paper Size Selector in Store Tab */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                  Ukuran Lebar Kertas Struk
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('size')}
                  className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Konfigurasi Lengkap →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {PAPER_SIZE_OPTIONS.map((opt) => {
                  const isSelected = (receipt.paperSizePreset || '80mm') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.id === 'CUSTOM') {
                          setActiveTab('size');
                        } else {
                          handleRecalculate({
                            paperSizePreset: opt.id,
                            paperWidthMm: opt.widthMm,
                          });
                        }
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.id === 'CUSTOM' ? `Custom (${getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm)}mm)` : `${opt.name}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="header-notes-input">Pesan Header / Slogan Toko</label>
                <input
                  type="text"
                  id="header-notes-input"
                  value={receipt.notesHeader}
                  onChange={(e) => handleRecalculate({ notesHeader: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                  placeholder="E.g., PROMO BULAN INI / PT. MAKMUR SEJAHTERA"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="footer-notes-input">Pesan Footer / Terima Kasih</label>
                <textarea
                  id="footer-notes-input"
                  value={receipt.notesFooter}
                  onChange={(e) => handleRecalculate({ notesFooter: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none resize-none"
                  placeholder="E.g., Terima Kasih atas Kunjungan Anda"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="currency-symbol-select">Simbol Mata Uang</label>
              <div className="grid grid-cols-4 gap-2">
                {['Rp', '$', '€', '¥'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setCurrencySymbol(sym)}
                    className={`py-1.5 border rounded-lg text-sm font-semibold transition ${
                      currencySymbol === sym
                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ITEMS IN THE RECEIPT */}
        {activeTab === 'items' && (
          <div className="space-y-4" id="form-section-items">
            
            {/* Quick Add Grid */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Add (Klik untuk Memilih)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {QUICK_ITEMS.map((qi, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickAddItem(qi)}
                    className="text-left px-2 py-1.5 border border-slate-150 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 rounded-lg transition duration-150"
                  >
                    <div className="text-[10px] font-medium text-slate-700 truncate">{qi.name}</div>
                    <div className="text-[9px] font-mono font-semibold text-slate-500">
                      {currencySymbol} {qi.price.toLocaleString('id-ID')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Input Form for adding a custom item */}
            <form onSubmit={handleAddItem} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-slate-900" /> Tambah Barang Kustom
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5" htmlFor="custom-item-name">Nama Barang</label>
                  <input
                    type="text"
                    id="custom-item-name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    placeholder="Contoh: Aqua 600ml, Roti Tawar..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5" htmlFor="custom-item-price">Harga/Unit</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400 font-mono text-[9px]">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        id="custom-item-price"
                        value={newItemPrice || ''}
                        onChange={(e) => setNewItemPrice(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-6 pr-1 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5" htmlFor="custom-item-qty">Qty</label>
                    <input
                      type="number"
                      id="custom-item-qty"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none text-center"
                      min="1"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5" htmlFor="custom-item-discount">Diskon (%)</label>
                    <input
                      type="number"
                      id="custom-item-discount"
                      value={newItemDiscount || ''}
                      onChange={(e) => setNewItemDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none text-center"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!newItemName.trim() || newItemPrice <= 0}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                id="add-item-button"
              >
                <Plus className="w-3.5 h-3.5" /> Tambahkan ke Struk
              </button>
            </form>

            {/* Current Item List */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Barang di Struk</h4>
                <span className="text-[10px] font-mono text-slate-500">
                  Subtotal: {currencySymbol} {receipt.subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {receipt.items.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
                  Belum ada barang ditambahkan. Tambahkan barang di atas atau gunakan preset di tab sebelah!
                </div>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {receipt.items.map((item) => {
                    const originalTotal = item.price * item.quantity;
                    const itemDiscRate = item.discountRate || 0;
                    const itemDiscAmount = Math.round(originalTotal * (itemDiscRate / 100));
                    const finalTotal = originalTotal - itemDiscAmount;

                    return (
                      <div key={item.id} className="p-3 bg-white hover:bg-slate-50/50 flex flex-col gap-2 transition">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItemProperty(item.id, 'name', e.target.value)}
                              className="font-semibold text-slate-800 text-xs bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-900 focus:bg-white px-1 outline-none w-full rounded truncate"
                            />
                            {itemDiscRate > 0 && (
                              <span className="inline-block text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold mt-1">
                                Diskon {itemDiscRate}% (-{currencySymbol} {itemDiscAmount.toLocaleString('id-ID')})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              {itemDiscRate > 0 ? (
                                <>
                                  <span className="text-[10px] font-mono line-through text-slate-400 block leading-tight">
                                    {currencySymbol} {originalTotal.toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-900 block leading-tight">
                                    {currencySymbol} {finalTotal.toLocaleString('id-ID')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs font-mono font-semibold text-slate-700 block">
                                  {currencySymbol} {originalTotal.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              title="Hapus barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono pt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Harga:</span>
                            <input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => handleUpdateItemProperty(item.id, 'price', Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-16 border-b border-slate-200 focus:border-slate-900 focus:bg-white text-center rounded outline-none text-xs font-mono text-slate-600 py-0.5"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-[10px]">Qty:</span>
                            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemProperty(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-500 font-bold"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-mono text-slate-700 font-semibold">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemProperty(item.id, 'quantity', item.quantity + 1)}
                                className="px-1.5 py-0.5 hover:bg-slate-100 text-slate-500 font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Disc (%):</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountRate || ''}
                              onChange={(e) => handleUpdateItemProperty(item.id, 'discountRate', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                              className="w-12 border-b border-slate-200 focus:border-slate-900 focus:bg-white text-center rounded outline-none text-xs font-mono text-slate-600 py-0.5"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT, TAX & DISCOUNTS */}
        {activeTab === 'payment' && (
          <div className="space-y-4" id="form-section-payment">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Metode Bayar, Diskon & Pajak</h3>

            {/* Discounts */}
            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-slate-900" /> Diskon
                </label>
                <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
                  <button
                    type="button"
                    onClick={() => handleRecalculate({ discountType: 'PERCENT', discountRate: 0 })}
                    className={`px-2 py-1 font-bold ${
                      receipt.discountType === 'PERCENT'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    % Persen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRecalculate({ discountType: 'FIXED', discountRate: 0 })}
                    className={`px-2 py-1 font-bold ${
                      receipt.discountType === 'FIXED'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Nominal ({currencySymbol})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1">
                  Nilai Diskon ({receipt.discountType === 'PERCENT' ? '%' : currencySymbol})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={receipt.discountRate || ''}
                    onChange={(e) => handleRecalculate({ discountRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-mono"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold font-mono">
                    {receipt.discountType === 'PERCENT' ? '%' : currencySymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Taxes */}
            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-900" /> Pajak / PPN
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 5, 10, 11].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleRecalculate({ taxRate: p })}
                    className={`py-1.5 border rounded-lg text-xs font-bold transition font-mono ${
                      receipt.taxRate === p
                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-1" htmlFor="custom-tax-input">Pajak Lainnya (%)</label>
                <input
                  type="number"
                  id="custom-tax-input"
                  value={receipt.taxRate || ''}
                  onChange={(e) => handleRecalculate({ taxRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-mono"
                  placeholder="Atur pajak custom..."
                />
              </div>
            </div>

            {/* Payment Method & Settlement Method */}
            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5" htmlFor="payment-method-select">
                  <DollarSign className="w-3.5 h-3.5 text-slate-900" /> Metode Pembayaran
                </label>
                <select
                  id="payment-method-select"
                  value={receipt.paymentMethod}
                  onChange={(e) => handleRecalculate({ paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-semibold text-slate-700"
                >
                  <option value="CASH">💵 TUNAI (CASH)</option>
                  <option value="QRIS">📱 QRIS / E-WALLET</option>
                  <option value="DEBIT">💳 KARTU DEBIT</option>
                  <option value="CREDIT">💳 KARTU KREDIT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5" htmlFor="payment-status-select">
                  <CheckCircle className="w-3.5 h-3.5 text-slate-900" /> Metode Pelunasan (Status)
                </label>
                <select
                  id="payment-status-select"
                  value={receipt.paymentStatus || 'SUDAH_LUNAS'}
                  onChange={(e) => handleRecalculate({ paymentStatus: e.target.value as PaymentStatus })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-semibold text-slate-700"
                >
                  <option value="SUDAH_LUNAS">✅ SUDAH LUNAS (PAID)</option>
                  <option value="BELUM_LUNAS">⏳ BELUM LUNAS (UNPAID)</option>
                  <option value="HUTANG">💸 HUTANG (DEBT)</option>
                </select>
              </div>

              {/* Show Cash details if payment is Cash */}
              {receipt.paymentMethod === 'CASH' && (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1" htmlFor="cash-received-input">Uang Tunai Diterima</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        id="cash-received-input"
                        value={receipt.cashReceived || ''}
                        onChange={(e) => handleRecalculate({ cashReceived: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white font-mono text-slate-900 font-semibold focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Cash Suggestion Quick Buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      receipt.total,
                      Math.ceil(receipt.total / 10000) * 10000,
                      Math.ceil(receipt.total / 50000) * 50000,
                      Math.ceil(receipt.total / 100000) * 100000,
                    ]
                      .filter((val, i, arr) => arr.indexOf(val) === i && val >= receipt.total)
                      .slice(0, 4)
                      .map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRecalculate({ cashReceived: val })}
                          className="py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-mono font-semibold transition text-slate-600 hover:text-slate-900 hover:border-slate-450"
                        >
                          {val.toLocaleString('id-ID')}
                        </button>
                      ))}
                  </div>

                  {/* Change calculation */}
                  <div className="flex justify-between items-center bg-slate-900/5 border border-slate-250/60 p-2.5 rounded-lg">
                    <span className="text-xs font-bold text-slate-850">Kembalian:</span>
                    <span className="text-sm font-mono font-bold text-slate-900">
                      {currencySymbol} {receipt.changeAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: UKURAN KERTAS & THERMAL PRINTER CONFIGURATION */}
        {activeTab === 'size' && (
          <div className="space-y-5" id="form-section-paper-size">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-[10px] font-bold">
                  <Printer className="w-3 h-3" />
                  <span>Kompatibilitas Thermal Printer & Ukuran Kertas</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold font-display text-white">
                  Ukuran Lebar Kertas Struk
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sesuaikan lebar kertas untuk printer bluetooth portable (58mm), printer kasir desktop standar (80mm), dot matrix (76mm), atau ukuran custom.
                </p>
              </div>

              <div className="bg-slate-800/90 border border-indigo-500/30 p-3 rounded-xl flex items-center gap-3 shrink-0">
                <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse shrink-0"></div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">Ukuran Aktif:</div>
                  <div className="text-sm font-black font-mono text-white">
                    {getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm)} mm
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Preset Cards */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Pilih Preset Ukuran Kertas Thermal:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PAPER_SIZE_OPTIONS.map((preset) => {
                  const isActive = (receipt.paperSizePreset || '80mm') === preset.id;
                  const currentWidth = getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm);

                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        if (preset.id === 'CUSTOM') {
                          handleRecalculate({
                            paperSizePreset: 'CUSTOM',
                            paperWidthMm: receipt.paperWidthMm || 80,
                          });
                        } else {
                          handleRecalculate({
                            paperSizePreset: preset.id,
                            paperWidthMm: preset.widthMm,
                          });
                        }
                      }}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between relative ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/10 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              <Maximize2 className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                          </div>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                              Aktif
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-3">
                          {preset.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Lebar Fisik:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {preset.id === 'CUSTOM' ? `${currentWidth} mm` : `${preset.widthMm} mm`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Millimeter Adjuster (Interactive Slider & Inputs) */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    Penyesuaian Lebar Kustom (Milimeter)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Bebas atur lebar struk sesuai gulungan kertas dan batas margin printer Anda (40 mm - 210 mm).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm)} mm (~{Math.round(getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm) * 4.375)}px)
                  </span>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Geser untuk mengubah lebar:</span>
                  <span className="font-mono text-indigo-600">{getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm)} mm</span>
                </div>
                <input
                  type="range"
                  id="tab-custom-paper-width-slider"
                  min="40"
                  max="150"
                  step="1"
                  value={getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    handleRecalculate({
                      paperSizePreset: 'CUSTOM',
                      paperWidthMm: val,
                    });
                  }}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>40 mm (Mini)</span>
                  <span>58 mm (Bluetooth)</span>
                  <span>80 mm (Standar)</span>
                  <span>100 mm (Lebar)</span>
                  <span>150 mm</span>
                </div>
              </div>

              {/* Quick Stepper Buttons & Manual Input */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const cur = getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm);
                    handleRecalculate({
                      paperSizePreset: 'CUSTOM',
                      paperWidthMm: Math.max(40, cur - 5),
                    });
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  <Minus className="w-3.5 h-3.5" /> -5mm
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cur = getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm);
                    handleRecalculate({
                      paperSizePreset: 'CUSTOM',
                      paperWidthMm: Math.max(40, cur - 1),
                    });
                  }}
                  className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  -1mm
                </button>

                <div className="relative flex-1 min-w-[120px]">
                  <input
                    type="number"
                    min="30"
                    max="220"
                    value={getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 30 && val <= 250) {
                        handleRecalculate({
                          paperSizePreset: 'CUSTOM',
                          paperWidthMm: val,
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center font-mono font-bold text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none shadow-2xs"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none font-bold">mm</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const cur = getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm);
                    handleRecalculate({
                      paperSizePreset: 'CUSTOM',
                      paperWidthMm: Math.min(210, cur + 1),
                    });
                  }}
                  className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                >
                  +1mm
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cur = getPaperWidthMm(receipt.paperSizePreset, receipt.paperWidthMm);
                    handleRecalculate({
                      paperSizePreset: 'CUSTOM',
                      paperWidthMm: Math.min(210, cur + 5),
                    });
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> +5mm
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleRecalculate({
                      paperSizePreset: '80mm',
                      paperWidthMm: 80,
                    });
                  }}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
                  title="Kembalikan ke standar 80mm"
                >
                  Reset (80mm)
                </button>
              </div>
            </div>

            {/* Thermal Print Setup Guide & Best Practices */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Printer className="w-4 h-4 text-amber-700" />
                <span>Panduan Cetak Thermal Bebas Potong Margin:</span>
              </div>
              <ul className="text-[11px] text-amber-900/90 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>
                  <strong>Margins / Batas Halaman:</strong> Pada jendela cetak (Ctrl+P), selalu atur <strong>Margins: None (Tanpa Margin)</strong> agar teks tidak terpotong di tepi kertas roll.
                </li>
                <li>
                  <strong>Background Graphics:</strong> Centang opsi <em>Background Graphics</em> agar watermark, stempel lunas, dan pembatas garis tercetak sempurna.
                </li>
                <li>
                  <strong>Printer 58mm Portable:</strong> Untuk printer 58mm (Moka, GoBiz, Zjiang), disarankan menggunakan font monospaced yang padat seperti <em>Default (JetBrains Mono)</em> atau <em>Dot Matrix</em>.
                </li>
                <li>
                  <strong>Ekspor PDF & Gambar:</strong> File PDF dan gambar yang diunduh otomatis dipotong pas sesuai milimeter ukuran yang Anda pilih di atas.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 4: UBAH FONT STRUK (EAS FONT PACK, DEFAULT, DOT MATRIX, CUSTOM TTF/OTF, ETC.) */}
        {activeTab === 'fonts' && (
          <div className="space-y-5" id="form-section-fonts">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>Koleksi Tipografi Thermal & EAS Font Pack</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold font-display text-white">
                  Pilihan Font Struk Belanja
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pilih gaya huruf untuk struk kasir Anda, atau impor font kustom sendiri (.TTF / .OTF). Otomatis diterapkan pada pratinjau, cetak printer thermal, dan ekspor.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
                {/* Impor Font Kustom Button */}
                <label 
                  htmlFor="receipt-custom-font-input" 
                  className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  title="Unggah berkas font TrueType (.ttf) atau OpenType (.otf)"
                >
                  <FolderUp className="w-4 h-4 text-slate-950" />
                  <span>Impor Font Kustom</span>
                  <input
                    id="receipt-custom-font-input"
                    type="file"
                    accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf,application/x-font-opentype"
                    onChange={handleImportCustomFont}
                    className="hidden"
                  />
                </label>

                <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl flex items-center gap-2.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
                  <div>
                    <div className="text-[9px] font-bold uppercase text-slate-400">Font Terpilih:</div>
                    <div className="text-xs font-extrabold text-white truncate max-w-[140px]">
                      {(() => {
                        const currentId = receipt.fontFamily || 'DEFAULT';
                        const customMatch = customFonts.find(f => f.id === currentId || f.name === currentId);
                        if (customMatch) return `${customMatch.name}`;
                        const stdMatch = RECEIPT_FONTS.find(f => f.id === currentId);
                        if (stdMatch) return stdMatch.name;
                        return 'Default';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Notification */}
            {fontUploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-2.5 text-rose-800 text-xs font-medium animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal Mengimpor Font:</span> {fontUploadError}
                    <div className="text-[11px] text-rose-600 mt-0.5">
                      Catatan: Sistem hanya mendukung format font <strong>.ttf</strong> dan <strong>.otf</strong>.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFontUploadError('')}
                  className="text-rose-500 hover:text-rose-800 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Success Notification */}
            {fontUploadSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-2.5 text-emerald-800 text-xs font-medium animate-fadeIn">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Sukses:</span> {fontUploadSuccess}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFontUploadSuccess('')}
                  className="text-emerald-500 hover:text-emerald-800 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Custom Font Dropzone & Info Card */}
            <div className="bg-amber-50/50 border border-dashed border-amber-300/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                  <FileUp className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950">Dukungan Font Kustom (.TTF & .OTF)</h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                    Punya font struk khusus dari printer POS Anda? Unggah berkas font <strong>.ttf</strong> atau <strong>.otf</strong>. Font akan tersimpan di peramban dan siap dipakai kapan saja.
                  </p>
                </div>
              </div>
              <label
                htmlFor="receipt-custom-font-input-secondary"
                className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-amber-700" />
                <span>Pilih Berkas (.ttf/.otf)</span>
                <input
                  id="receipt-custom-font-input-secondary"
                  type="file"
                  accept=".ttf,.otf,font/ttf,font/otf,application/x-font-ttf,application/x-font-opentype"
                  onChange={handleImportCustomFont}
                  className="hidden"
                />
              </label>
            </div>

            {/* Filter Pills & Interactive Test String Input */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800">Filter Kategori:</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {['ALL', ...(customFonts.length > 0 ? ['KUSTOM'] : []), 'DEFAULT', 'EAS', 'DOT MATRIX', 'CLASSIC', 'MODERN'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFontCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        fontCategoryFilter === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat === 'ALL' ? 'Semua' : cat === 'KUSTOM' ? 'Font Kustom' : cat}</span>
                      {cat === 'KUSTOM' && (
                        <span className="bg-amber-400 text-slate-950 text-[9px] px-1 rounded-full font-black">
                          {customFonts.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Test Input */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  Coba Teks Sendiri:
                </span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Ketik teks percobaan di sini (contoh: KASIR #01 - Rp 150.000)..."
                    value={customFontSampleText}
                    onChange={(e) => setCustomFontSampleText(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/15 outline-none"
                  />
                  {customFontSampleText && (
                    <button
                      type="button"
                      onClick={() => setCustomFontSampleText('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {(receipt.fontFamily || 'DEFAULT') !== 'DEFAULT' && (
                  <button
                    type="button"
                    onClick={() => handleRecalculate({ fontFamily: 'DEFAULT' })}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    title="Kembalikan ke font default"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Default
                  </button>
                )}
              </div>
            </div>

            {/* Font Cards Grid */}
            <div className="space-y-4" id="generator-font-cards">
              {/* SECTION: Custom Imported Fonts (if any and matching filter) */}
              {(fontCategoryFilter === 'ALL' || fontCategoryFilter === 'KUSTOM') && customFonts.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                      <FolderUp className="w-3.5 h-3.5 text-amber-600" />
                      <span>Font Kustom yang Diimpor ({customFonts.length})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFonts.map((cFont) => {
                      const isSelected = (receipt.fontFamily === cFont.id || receipt.fontFamily === cFont.name);
                      const sampleToDisplay = customFontSampleText.trim() || '12345 TOTAL Rp 50.000 (KUSTOM)';
                      const fontCss = `"${cFont.name}", "JetBrains Mono", ui-monospace, monospace`;

                      return (
                        <div
                          key={cFont.id}
                          onClick={() => handleRecalculate({ fontFamily: cFont.id })}
                          className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-amber-500/30'
                              : 'bg-white border-amber-200/80 text-slate-800 hover:border-amber-400 hover:bg-amber-50/30 hover:shadow-2xs'
                          }`}
                          id={`receipt-custom-font-${cFont.id}`}
                        >
                          {/* Top info badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isSelected 
                                  ? 'bg-amber-400 text-slate-950' 
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}>
                                KUSTOM .{cFont.format.toUpperCase()}
                              </span>
                              <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`} title={cFont.name}>
                                {cFont.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSelected ? (
                                <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Aktif</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Pilih
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomFont(cFont.id, cFont.name, e)}
                                className={`p-1 rounded-md transition cursor-pointer ${
                                  isSelected
                                    ? 'text-slate-400 hover:text-rose-300 hover:bg-white/10'
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title="Hapus font kustom ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Live Typography Preview Box */}
                          <div 
                            className={`text-xs p-2.5 rounded-lg border overflow-hidden whitespace-nowrap text-ellipsis transition ${
                              isSelected
                                ? 'bg-slate-800/90 border-slate-700 text-amber-300 font-semibold'
                                : 'bg-amber-50/50 border-amber-200/60 text-slate-900'
                            }`}
                            style={{ fontFamily: fontCss }}
                          >
                            <div className="truncate">{sampleToDisplay}</div>
                            <div className="text-[10px] opacity-75 mt-0.5 truncate">0123456789 • ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                            <span className="truncate max-w-[170px]" title={cFont.fileName}>📁 {cFont.fileName}</span>
                            <span>{Math.round(cFont.fileSize / 1024)} KB</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standard Built-in Fonts Grid */}
              {fontCategoryFilter !== 'KUSTOM' && (
                <div className="space-y-2.5">
                  {customFonts.length > 0 && fontCategoryFilter === 'ALL' && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 pt-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                        <Type className="w-3.5 h-3.5 text-slate-600" />
                        <span>Font Bawaan Sistem Thermal</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {RECEIPT_FONTS
                      .filter((font) => fontCategoryFilter === 'ALL' || font.category === fontCategoryFilter)
                      .map((font) => {
                        const isSelected = (receipt.fontFamily || 'DEFAULT') === font.id;
                        const sampleToDisplay = customFontSampleText.trim() || font.sampleText;

                        return (
                          <div
                            key={font.id}
                            onClick={() => handleRecalculate({ fontFamily: font.id })}
                            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/15'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-2xs'
                            }`}
                            id={`receipt-font-${font.id}`}
                          >
                            {/* Top info badge */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  isSelected 
                                    ? 'bg-white/20 text-white' 
                                    : font.category === 'EAS'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : font.category === 'DEFAULT'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : font.category === 'DOT MATRIX'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {font.category}
                                </span>
                                <span className={`text-xs font-bold truncate max-w-[140px] ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  {font.name}
                                </span>
                              </div>

                              {isSelected ? (
                                <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>Aktif</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-600">
                                  Pilih
                                </span>
                              )}
                            </div>

                            {/* Live Typography Preview Box */}
                            <div 
                              className={`text-xs p-2.5 rounded-lg border overflow-hidden whitespace-nowrap text-ellipsis transition ${
                                isSelected
                                  ? 'bg-slate-800/90 border-slate-700 text-amber-300 font-semibold'
                                  : 'bg-slate-50 border-slate-150 text-slate-900'
                              }`}
                              style={{ fontFamily: font.fontFamilyCss }}
                            >
                              <div className="truncate">{sampleToDisplay}</div>
                              <div className="text-[10px] opacity-75 mt-0.5 truncate">1234567890 • Rp 45.000</div>
                            </div>

                            {/* Description */}
                            <p className={`text-[10px] leading-relaxed line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {font.description}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Informational Card */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Tips Cetak Thermal & Font Kustom:</strong> Pilihan font ini otomatis berlaku ketika Anda menekan <em>Cetak Thermal Struk</em>, menyimpan file <em>Gambar JPG/PNG</em>, mengekspor <em>PDF</em>, ataupun menyimpan data ke <em>Riwayat Ledger</em>.
              </p>
            </div>

          </div>
        )}

        {/* TAB: UBAH LABEL & CUSTOM FIELDS */}
        {activeTab === 'labels' && (
          <div className="space-y-5" id="form-section-labels">
            {/* Header Banner */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-lg shrink-0 mt-0.5">
                <Tag className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Kustomisasi Label & Tambah Field Sendiri</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Sesuaikan teks penamaan kolom standar struk (seperti mengganti "No. Bon", "Kasir", "Subtotal") atau tambahkan baris data kustom Anda sendiri (seperti No. Meja, Driver Ojol, Plat Nomor Kendaraan, Poin Member, Garansi Toko).
                </p>
              </div>
            </div>

            {/* Notification Feedback Message */}
            {labelFeedbackMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                labelFeedbackMsg.startsWith('Error') 
                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                <span>{labelFeedbackMsg}</span>
                <button 
                  type="button" 
                  onClick={() => setLabelFeedbackMsg('')} 
                  className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Sub-tabs Selector */}
            <div className="flex border border-slate-200 bg-slate-100/80 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setLabelSubTab('CUSTOM')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  labelSubTab === 'CUSTOM'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>Tambah Label Sendiri</span>
                {(receipt.customLabels?.length || 0) > 0 && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {receipt.customLabels?.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setLabelSubTab('STANDARD')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  labelSubTab === 'STANDARD'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Ubah Label Standar</span>
              </button>
              <button
                type="button"
                onClick={() => setLabelSubTab('PRESETS')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  labelSubTab === 'PRESETS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                <span>Preset Bahasa</span>
              </button>
            </div>

            {/* SUBTAB 1: TAMBAH LABEL SENDIRI (CUSTOM LABELS) */}
            {labelSubTab === 'CUSTOM' && (
              <div className="space-y-4">
                {/* Form Tambah Label Kustom */}
                <div className="bg-slate-50/70 p-4 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-slate-900" /> Tambah Baris Label Baru ke Struk
                    </h4>
                    <span className="text-[10px] text-slate-400">Muncul langsung di struk</span>
                  </div>

                  <form onSubmit={handleAddCustomLabel} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama Label / Judul Kolom <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCustomLabel}
                          onChange={(e) => setNewCustomLabel(e.target.value)}
                          placeholder="Cth: No. Meja, Driver Ojol, Plat Nomor"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Isi / Nilai Teks <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCustomValue}
                          onChange={(e) => setNewCustomValue(e.target.value)}
                          placeholder="Cth: Meja 12 (Outdoor), GoFood - Budi"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Posisi Penempatan di Struk
                        </label>
                        <select
                          value={newCustomPosition}
                          onChange={(e) => setNewCustomPosition(e.target.value as CustomLabelPosition)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none cursor-pointer"
                        >
                          <option value="META">📌 Info Nota (Dekat No. Bon & Kasir)</option>
                          <option value="HEADER">🏢 Header Toko (Bawah Alamat)</option>
                          <option value="ITEMS_SUMMARY">🛒 Ringkasan Barang (Dekat Subtotal)</option>
                          <option value="PAYMENT">💳 Pembayaran (Dekat Cara Bayar)</option>
                          <option value="FOOTER">📄 Footer Struk (Bawah Barcode/QR)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4 sm:col-span-2 pt-2 sm:pt-6">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCustomIsBold}
                            onChange={(e) => setNewCustomIsBold(e.target.checked)}
                            className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                          />
                          <span>Cetak Tebal (Bold)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newCustomShowColon}
                            onChange={(e) => setNewCustomShowColon(e.target.checked)}
                            className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                          />
                          <span>Titik Dua (:)</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Tambah Label ke Struk
                      </button>
                    </div>
                  </form>
                </div>

                {/* Quick Add Suggestions Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-amber-500" /> Saran Label Populer (Klik untuk Tambah Instan)
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_CUSTOM_LABELS.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddSuggestedCustom(sug)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-400 text-slate-700 font-medium rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs group"
                        title={`Posisi: ${sug.position} | Nilai: ${sug.value}`}
                      >
                        <Plus className="w-3 h-3 text-slate-400 group-hover:text-slate-900" />
                        <span>{sug.label}: <strong>{sug.value}</strong></span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* List of Active Custom Labels */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Label Kustom Aktif di Struk ({receipt.customLabels?.length || 0})
                    </h4>
                    {(receipt.customLabels?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRecalculate({ customLabels: [] })}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                      >
                        Hapus Semua Label Kustom
                      </button>
                    )}
                  </div>

                  {(!receipt.customLabels || receipt.customLabels.length === 0) ? (
                    <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 space-y-2">
                      <Tag className="w-6 h-6 text-slate-300 mx-auto" />
                      <div className="text-xs font-bold text-slate-700">Belum Ada Label Kustom</div>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Tambahkan label kustom di atas atau klik salah satu saran cepat untuk memunculkan informasi tambahan di struk Anda.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {receipt.customLabels.map((lbl, idx) => {
                        const positionNames: Record<CustomLabelPosition, string> = {
                          META: 'Info Nota (Atas)',
                          HEADER: 'Header Toko',
                          ITEMS_SUMMARY: 'Ringkasan Item',
                          PAYMENT: 'Pembayaran',
                          FOOTER: 'Footer Struk'
                        };

                        return (
                          <div
                            key={lbl.id || idx}
                            className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5 transition hover:border-slate-300"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                📍 {positionNames[lbl.position] || lbl.position}
                              </span>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={lbl.isBold || false}
                                    onChange={(e) => handleUpdateCustomLabel(lbl.id, { isBold: e.target.checked })}
                                    className="w-3.5 h-3.5 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                                  />
                                  <span>Tebal</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomLabel(lbl.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                  title="Hapus label ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Nama Label</label>
                                <input
                                  type="text"
                                  value={lbl.label}
                                  onChange={(e) => handleUpdateCustomLabel(lbl.id, { label: e.target.value })}
                                  placeholder="Nama Label"
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Isi Teks</label>
                                <input
                                  type="text"
                                  value={lbl.value}
                                  onChange={(e) => handleUpdateCustomLabel(lbl.id, { value: e.target.value })}
                                  placeholder="Nilai / Isi"
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Posisi</label>
                                <select
                                  value={lbl.position}
                                  onChange={(e) => handleUpdateCustomLabel(lbl.id, { position: e.target.value as CustomLabelPosition })}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none cursor-pointer"
                                >
                                  <option value="META">📌 Info Nota</option>
                                  <option value="HEADER">🏢 Header Toko</option>
                                  <option value="ITEMS_SUMMARY">🛒 Ringkasan Barang</option>
                                  <option value="PAYMENT">💳 Pembayaran</option>
                                  <option value="FOOTER">📄 Footer</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 2: UBAH LABEL STANDAR (STANDARD LABELS) */}
            {labelSubTab === 'STANDARD' && (
              <div className="space-y-4">
                <div className="bg-slate-50/70 p-4 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Ganti Teks Label Standar Struk
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ubah istilah bawaan jika Anda memerlukan bahasa asing atau format nota khusus.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetStandardLabels}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Kembalikan semua teks label ke default"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" /> Reset Default
                    </button>
                  </div>

                  {(() => {
                    const currentLabels = getReceiptLabels(receipt.labels);
                    const standardFields: Array<{
                      key: keyof ReceiptLabels;
                      title: string;
                      placeholder: string;
                      currentValue: string;
                      category: string;
                    }> = [
                      {
                        key: 'transactionIdLabel',
                        title: 'Nomor Transaksi / Bon',
                        placeholder: 'No. Bon:',
                        currentValue: currentLabels.transactionIdLabel,
                        category: 'Metadata Transaksi'
                      },
                      {
                        key: 'dateTimeLabel',
                        title: 'Tanggal & Waktu',
                        placeholder: 'Tanggal:',
                        currentValue: currentLabels.dateTimeLabel,
                        category: 'Metadata Transaksi'
                      },
                      {
                        key: 'cashierLabel',
                        title: 'Nama Kasir / Staff',
                        placeholder: 'Kasir:',
                        currentValue: currentLabels.cashierLabel,
                        category: 'Metadata Transaksi'
                      },
                      {
                        key: 'customerLabel',
                        title: 'Nama Pelanggan / Tamu',
                        placeholder: 'Pelanggan:',
                        currentValue: currentLabels.customerLabel,
                        category: 'Metadata Transaksi'
                      },
                      {
                        key: 'subtotalLabel',
                        title: 'Label Subtotal',
                        placeholder: 'SUBTOTAL:',
                        currentValue: currentLabels.subtotalLabel,
                        category: 'Ringkasan Biaya'
                      },
                      {
                        key: 'discountLabel',
                        title: 'Label Diskon Utama',
                        placeholder: 'DISKON',
                        currentValue: currentLabels.discountLabel,
                        category: 'Ringkasan Biaya'
                      },
                      {
                        key: 'itemDiscountLabel',
                        title: 'Label Diskon Per Barang',
                        placeholder: 'DISKON BARANG:',
                        currentValue: currentLabels.itemDiscountLabel,
                        category: 'Ringkasan Biaya'
                      },
                      {
                        key: 'taxLabel',
                        title: 'Label Pajak / PPN',
                        placeholder: 'PAJAK / PPN',
                        currentValue: currentLabels.taxLabel,
                        category: 'Ringkasan Biaya'
                      },
                      {
                        key: 'totalLabel',
                        title: 'Label Total Akhir',
                        placeholder: 'TOTAL AKHIR:',
                        currentValue: currentLabels.totalLabel,
                        category: 'Ringkasan Biaya'
                      },
                      {
                        key: 'paymentMethodLabel',
                        title: 'Label Metode Pembayaran',
                        placeholder: 'METODE BAYAR:',
                        currentValue: currentLabels.paymentMethodLabel,
                        category: 'Detail Pelunasan'
                      },
                      {
                        key: 'paymentStatusLabel',
                        title: 'Label Status Pelunasan',
                        placeholder: 'STATUS PELUNASAN:',
                        currentValue: currentLabels.paymentStatusLabel,
                        category: 'Detail Pelunasan'
                      },
                      {
                        key: 'cashReceivedLabel',
                        title: 'Label Bayar Tunai (Cash)',
                        placeholder: 'BAYAR TUNAI:',
                        currentValue: currentLabels.cashReceivedLabel,
                        category: 'Detail Pelunasan'
                      },
                      {
                        key: 'changeAmountLabel',
                        title: 'Label Uang Kembalian',
                        placeholder: 'KEMBALIAN:',
                        currentValue: currentLabels.changeAmountLabel,
                        category: 'Detail Pelunasan'
                      },
                    ];

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {standardFields.map((field) => (
                          <div key={field.key} className="space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-bold text-slate-700">{field.title}</label>
                              <span className="text-[9px] text-slate-400 font-mono">{field.placeholder}</span>
                            </div>
                            <input
                              type="text"
                              value={receipt.labels?.[field.key] ?? ''}
                              onChange={(e) => handleUpdateStandardLabel(field.key, e.target.value)}
                              placeholder={`Default: ${field.placeholder}`}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-medium text-slate-900"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* SUBTAB 3: PRESET BAHASA & INDUSTRI (PRESETS) */}
            {labelSubTab === 'PRESETS' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Pilih Preset Bahasa atau Format Industri
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Terapkan paket label yang sudah disesuaikan untuk tipe bisnis atau bahasa tertentu dengan 1 klik.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LABEL_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="bg-white border border-slate-200 hover:border-slate-900 p-4 rounded-xl space-y-3 transition group flex flex-col justify-between shadow-2xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-500" />
                            {preset.name}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {preset.description}
                        </p>

                        <div className="bg-slate-50 p-2 rounded-lg text-[10px] font-mono text-slate-600 space-y-0.5 border border-slate-100">
                          <div>• {preset.labels.transactionIdLabel} 102938</div>
                          <div>• {preset.labels.cashierLabel} Budi</div>
                          <div>• {preset.labels.totalLabel} Rp 75.000</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyLabelPreset(preset)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold rounded-lg transition text-center cursor-pointer"
                      >
                        Terapkan Preset Ini
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BARCODE & QR CODE GENERATOR */}
        {activeTab === 'code' && (
          <div className="space-y-6" id="form-section-barcode-qr">
            {/* Intro banner */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-lg shrink-0 mt-0.5">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Generator Barcode & QR Code Footer</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Tambahkan QR Code dan Barcode di bagian bawah struk untuk membuat struk terlihat lebih profesional. QR Code dapat langsung discan dengan kamera smartphone untuk melihat URL toko, membuka tautan verifikasi, atau membaca detail transaksi unik.
                </p>
              </div>
            </div>

            {/* Display Type Mode Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Format Tampilan Footer
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'BOTH', label: 'Barcode & QR', desc: 'Lengkap (Rekomendasi)', icon: Sparkles },
                  { id: 'QR', label: 'QR Code Saja', desc: 'Scan Interaktif', icon: QrCode },
                  { id: 'BARCODE', label: 'Barcode Saja', desc: 'Gaya Retail Tradisional', icon: Barcode },
                  { id: 'NONE', label: 'Sembunyikan', desc: 'Tanpa Kode', icon: EyeOff },
                ].map((mode) => {
                  const IconComp = mode.icon;
                  const isSelected = (receipt.codeDisplayType || 'BOTH') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handleRecalculate({ codeDisplayType: mode.id as CodeDisplayType })}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{mode.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {mode.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* QR Code Configuration Section */}
            {(receipt.codeDisplayType || 'BOTH') !== 'BARCODE' && (receipt.codeDisplayType || 'BOTH') !== 'NONE' && (
              <div className="bg-white p-4.5 border border-slate-200 rounded-xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-slate-900" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pengaturan QR Code</h4>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                    Dapat Discan
                  </span>
                </div>

                {/* Quick Presets for QR Content */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Pilihan Isi Cepat Konten QR:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const txData = `STRUK ID: ${receipt.transactionId}\nTOKO: ${receipt.storeName || 'TOKO'}\nTGL: ${receipt.dateTime}\nTOTAL: ${formatCurrency(receipt.total, currencySymbol)}\nSTATUS: ${receipt.paymentStatus === 'SUDAH_LUNAS' ? 'LUNAS' : receipt.paymentStatus}`;
                        handleRecalculate({ 
                          qrValue: txData,
                          qrLabel: 'Scan untuk verifikasi struk asli'
                        });
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-[11px] transition text-slate-750 font-medium hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">Detail Transaksi Unik</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const siteUrl = receipt.storeWebsite 
                          ? (receipt.storeWebsite.startsWith('http') ? receipt.storeWebsite : `https://${receipt.storeWebsite}`) 
                          : 'https://www.tokoonline.com';
                        handleRecalculate({ 
                          qrValue: siteUrl,
                          qrLabel: 'Scan untuk kunjungi website kami'
                        });
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-[11px] transition text-slate-750 font-medium hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">URL Website Toko</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const verifyUrl = `https://strukku.app/verify/${encodeURIComponent(receipt.transactionId.replace(/\s+/g, ''))}`;
                        handleRecalculate({ 
                          qrValue: verifyUrl,
                          qrLabel: 'Scan untuk verifikasi keaslian'
                        });
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-[11px] transition text-slate-750 font-medium hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">Tautan Cek Struk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cleanPhone = (receipt.storePhone || '628123456789').replace(/[^0-9]/g, '');
                        const waUrl = `https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(receipt.storeName || 'Admin')}%2C%20saya%20ingin%20bertanya%20mengenai%20transaksi%20${encodeURIComponent(receipt.transactionId)}`;
                        handleRecalculate({ 
                          qrValue: waUrl,
                          qrLabel: 'Scan untuk chat CS WhatsApp'
                        });
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-[11px] transition text-slate-750 font-medium hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">WhatsApp CS Toko</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const qrisData = `00020101021126580014ID.LINKAJA.WWW011893600999${receipt.transactionId.replace(/[^0-9]/g, '').padEnd(12, '0')}520458125303360540${receipt.total.toString().padStart(6, '0')}5802ID5912${(receipt.storeName || 'STRUKKU POS').slice(0, 20)}6007JAKARTA6304`;
                        handleRecalculate({ 
                          qrValue: qrisData,
                          qrLabel: 'Scan untuk pembayaran QRIS'
                        });
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-[11px] transition text-slate-750 font-medium hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">QRIS / Pembayaran</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleRecalculate({ 
                          qrValue: '',
                          qrLabel: 'Scan untuk info detail'
                        });
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left text-[11px] transition text-slate-750 font-medium hover:text-slate-950 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="truncate">Reset ke Default</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Text/URL Content Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Konten / URL yang Dikodekan
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(receipt.qrValue || '').length} Karakter
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={receipt.qrValue || ''}
                    onChange={(e) => handleRecalculate({ qrValue: e.target.value })}
                    placeholder={`Default: URL Website Toko atau Detail Transaksi ID ${receipt.transactionId}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 font-mono focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none resize-y"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span>Masukkan link website (https://...), detail invoice, atau teks kustom lainnya.</span>
                    {receipt.qrValue && receipt.qrValue.startsWith('http') && (
                      <a
                        href={receipt.qrValue}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-900 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Buka URL
                      </a>
                    )}
                  </div>
                </div>

                {/* QR Code Caption / Label */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Teks Keterangan di Bawah QR Code (Footer Struk)
                  </label>
                  <input
                    type="text"
                    value={receipt.qrLabel !== undefined ? receipt.qrLabel : 'Scan untuk cek keaslian struk'}
                    onChange={(e) => handleRecalculate({ qrLabel: e.target.value })}
                    placeholder="Contoh: Scan untuk verifikasi struk asli"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                  />

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Scan untuk verifikasi struk asli',
                      'Scan untuk info promo & katalog',
                      'Scan untuk klaim garansi',
                      'Scan untuk kuesioner & hadiah',
                      '',
                    ].map((labelOption, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleRecalculate({ qrLabel: labelOption })}
                        className={`text-[10px] px-2 py-1 rounded-md border transition cursor-pointer ${
                          receipt.qrLabel === labelOption
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {labelOption === '' ? '🚫 Kosongkan Label' : labelOption}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR Code Size Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Ukuran QR Code pada Struk
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { size: 75, label: 'Kecil (75px)' },
                      { size: 90, label: 'Standar (90px)' },
                      { size: 110, label: 'Besar (110px)' },
                    ].map((sz) => (
                      <button
                        key={sz.size}
                        type="button"
                        onClick={() => handleRecalculate({ qrSize: sz.size })}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
                          (receipt.qrSize || 90) === sz.size
                            ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Barcode Configuration Section */}
            {(receipt.codeDisplayType || 'BOTH') !== 'QR' && (receipt.codeDisplayType || 'BOTH') !== 'NONE' && (
              <div className="bg-white p-4.5 border border-slate-200 rounded-xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-slate-900" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pengaturan Barcode</h4>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Nilai / Nomor Barcode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={receipt.barcodeValue || ''}
                      onChange={(e) => handleRecalculate({ barcodeValue: e.target.value })}
                      placeholder={`Otomatis: ${receipt.transactionId.split('/')[0]}`}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRecalculate({ barcodeValue: receipt.transactionId.split('/')[0] })}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer whitespace-nowrap"
                    >
                      Pakai No. Transaksi
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Kosongkan jika ingin barcode otomatis mengikuti Nomor ID Transaksi.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Tampilkan Nomor di Bawah Garis Barcode</div>
                    <div className="text-[11px] text-slate-400">Menampilkan teks *NOMOR-BARCODE* di bawah strip kode batang.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={receipt.showBarcodeNumber !== false}
                      onChange={(e) => handleRecalculate({ showBarcodeNumber: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Live Interactive Scanner Test Card */}
            {(receipt.codeDisplayType || 'BOTH') !== 'NONE' && (
              <div className="bg-slate-900 text-white p-4.5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Uji Langsung Hasil Scan
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Siap Discan Kamera
                  </span>
                </div>

                <div className="bg-white rounded-lg p-3 text-slate-900 flex flex-col sm:flex-row items-center gap-4">
                  {((receipt.codeDisplayType || 'BOTH') === 'QR' || (receipt.codeDisplayType || 'BOTH') === 'BOTH') && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shrink-0 flex flex-col items-center">
                      <QRCodeSVG
                        value={
                          (receipt.qrValue && receipt.qrValue.trim())
                            ? receipt.qrValue.trim()
                            : (receipt.storeWebsite 
                                ? (receipt.storeWebsite.startsWith('http') ? receipt.storeWebsite : `https://${receipt.storeWebsite}`) 
                                : `STRUK ID: ${receipt.transactionId}\nTOKO: ${receipt.storeName}\nTOTAL: ${formatCurrency(receipt.total, currencySymbol)}`)
                        }
                        size={84}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                      <span className="text-[8px] font-medium text-slate-500 mt-1">
                        Arahkan Kamera HP ke Sini
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5 w-full">
                    <div className="text-xs font-bold text-slate-800">Konten Terenkripsi QR:</div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-700 break-all max-h-20 overflow-y-auto">
                      {(receipt.qrValue && receipt.qrValue.trim())
                        ? receipt.qrValue.trim()
                        : (receipt.storeWebsite 
                            ? (receipt.storeWebsite.startsWith('http') ? receipt.storeWebsite : `https://${receipt.storeWebsite}`) 
                            : `STRUK ID: ${receipt.transactionId}\nTOKO: ${receipt.storeName}\nTGL: ${receipt.dateTime}\nTOTAL: ${formatCurrency(receipt.total, currencySymbol)}`)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const content = (receipt.qrValue && receipt.qrValue.trim())
                            ? receipt.qrValue.trim()
                            : (receipt.storeWebsite 
                                ? (receipt.storeWebsite.startsWith('http') ? receipt.storeWebsite : `https://${receipt.storeWebsite}`) 
                                : `STRUK ID: ${receipt.transactionId}\nTOKO: ${receipt.storeName}\nTGL: ${receipt.dateTime}\nTOTAL: ${formatCurrency(receipt.total, currencySymbol)}`);
                          navigator.clipboard.writeText(content);
                          setCopiedQrContent(true);
                          setTimeout(() => setCopiedQrContent(false), 2000);
                        }}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-950 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedQrContent ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedQrContent ? 'Tersalin!' : 'Salin Konten QR'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MOCK RETAIL TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-6" id="form-section-presets">
            {/* Create Custom Preset Card */}
            <div className="bg-slate-50/70 p-4 border border-slate-200 rounded-xl space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" /> Simpan Struk Sebagai Preset
                </h3>
                <p className="text-[11px] text-slate-500">
                  Simpan struk yang sedang Anda buat saat ini sebagai preset kustom agar dapat digunakan kembali dengan cepat kapan saja.
                </p>
              </div>

              <form onSubmit={handleSaveAsPreset} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder={`Nama Preset (cth: Toko ${receipt.storeName || 'Kustom'})`}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Preset
                  </button>
                </div>
              </form>

              {presetSuccessMsg && (
                <div className={`p-2 rounded-lg text-[11px] font-medium text-center ${
                  presetSuccessMsg.startsWith('Error') 
                    ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                    : 'bg-green-50 text-green-700 border border-green-100'
                }`}>
                  {presetSuccessMsg}
                </div>
              )}
            </div>

            {/* Custom Presets List */}
            {customPresets.length > 0 && (
              <div className="space-y-2.5">
                <div className="border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Preset Kustom Anda</h3>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {customPresets.map((preset, idx) => (
                    <div
                      key={idx}
                      className="w-full p-4 border border-slate-200 bg-white rounded-xl flex justify-between items-center group shadow-2xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{preset.name}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{preset.storeName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {preset.items?.length || 0} Item • PPN {preset.taxRate}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-750 font-bold text-xs py-1.5 px-3 rounded-lg transition"
                        >
                          Terapkan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePreset(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus preset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Default Retail POS Presets */}
            <div className="space-y-2.5">
              <div className="border-b border-slate-100 pb-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulasi POS Toko Retail</h3>
              </div>
              <p className="text-xs text-slate-500">
                Klik preset di bawah untuk mensimulasikan struk pembayaran minimarket atau kafe terpopuler di Indonesia secara instan.
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="w-full text-left p-4 border border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50/50 rounded-xl transition flex justify-between items-center group shadow-2xs"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-slate-900 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                        {preset.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{preset.storeName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {preset.items.length} Item • PPN {preset.taxRate}%
                      </div>
                    </div>
                    <div className="bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-600 font-bold text-xs py-1.5 px-3 rounded-lg transition">
                      Terapkan
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Save Receipt Action */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex gap-2">
        <button
          type="button"
          onClick={onNewReceipt}
          className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-98"
          id="new-receipt-button"
          title="Mulai transaksi baru dengan ID unik otomatis"
        >
          <PlusCircle className="w-4 h-4" /> Transaksi Baru
        </button>
        <button
          type="button"
          onClick={onSaveReceipt}
          disabled={receipt.items.length === 0}
          className="flex-1 py-3 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition active:scale-98"
          id="save-receipt-button"
        >
          <FileText className="w-4 h-4" /> Simpan Struk ke Riwayat
        </button>
      </div>
    </div>
  );
}
