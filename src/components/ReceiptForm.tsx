/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Item, PaymentMethod, PaymentStatus } from '../types';
import { generateTransactionId, calculateTotals } from '../utils';
import { 
  Store, 
  User, 
  Hash, 
  Calendar, 
  Plus, 
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
  CheckCircle
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
  const [activeTab, setActiveTab] = useState<'store' | 'items' | 'payment' | 'templates'>('store');
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

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full" id="receipt-form-panel">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50/70 p-2 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'store'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-store-info"
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Toko & Detail</span>
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'items'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-items"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Daftar Barang</span>
          {receipt.items.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === 'items' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-850'
            }`}>
              {receipt.items.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'payment'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-payment"
        >
          <Percent className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pembayaran & Pajak</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'templates'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
          }`}
          id="tab-presets"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preset</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* TAB 4: MOCK RETAIL TEMPLATES */}
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
