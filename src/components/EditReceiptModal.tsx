/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Item, PaymentMethod, PaymentStatus, ReceiptFontFamily, ReceiptPaperSizePreset } from '../types';
import { calculateTotals, formatCurrency, generateTransactionId, RECEIPT_FONTS, PAPER_SIZE_OPTIONS } from '../utils';
import { 
  X, 
  Check, 
  Save, 
  Plus, 
  Trash2, 
  Store, 
  User, 
  Calendar, 
  Hash, 
  CreditCard, 
  Percent, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  RefreshCw,
  Phone,
  Tag,
  Type,
  Printer
} from 'lucide-react';

interface EditReceiptModalProps {
  isOpen: boolean;
  receipt: Receipt | null;
  onClose: () => void;
  onSave: (updatedReceipt: Receipt) => void;
  onOpenInGenerator?: (receipt: Receipt) => void;
  currencySymbol: string;
}

export default function EditReceiptModal({
  isOpen,
  receipt,
  onClose,
  onSave,
  onOpenInGenerator,
  currencySymbol,
}: EditReceiptModalProps) {
  // Form states initialized when receipt changes
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [cashierName, setCashierName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [dateTime, setDateTime] = useState('');
  
  const [items, setItems] = useState<Item[]>([]);
  const [taxRate, setTaxRate] = useState<number>(11);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('SUDAH_LUNAS');
  const [cashReceived, setCashReceived] = useState<number>(0);
  
  const [notesHeader, setNotesHeader] = useState('');
  const [notesFooter, setNotesFooter] = useState('');
  
  const [fontFamily, setFontFamily] = useState<ReceiptFontFamily>('DEFAULT');
  const [paperSizePreset, setPaperSizePreset] = useState<ReceiptPaperSizePreset>('80mm');

  const [activeTab, setActiveTab] = useState<'items' | 'store' | 'payment' | 'notes'>('items');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync state whenever receipt prop opens or changes
  useEffect(() => {
    if (receipt) {
      setStoreName(receipt.storeName || '');
      setStoreAddress(receipt.storeAddress || '');
      setStorePhone(receipt.storePhone || '');
      setCashierName(receipt.cashierName || '');
      setCustomerName(receipt.customerName || '');
      setTransactionId(receipt.transactionId || '');
      setDateTime(receipt.dateTime || '');
      
      setItems(receipt.items ? receipt.items.map((it) => ({ ...it })) : []);
      setTaxRate(typeof receipt.taxRate === 'number' ? receipt.taxRate : 11);
      setDiscountRate(typeof receipt.discountRate === 'number' ? receipt.discountRate : 0);
      setDiscountType(receipt.discountType || 'PERCENT');
      
      setPaymentMethod(receipt.paymentMethod || 'CASH');
      setPaymentStatus(receipt.paymentStatus || 'SUDAH_LUNAS');
      setCashReceived(typeof receipt.cashReceived === 'number' ? receipt.cashReceived : 0);
      
      setNotesHeader(receipt.notesHeader || '');
      setNotesFooter(receipt.notesFooter || '');
      
      setFontFamily(receipt.fontFamily || 'DEFAULT');
      setPaperSizePreset(receipt.paperSizePreset || '80mm');
      
      setActiveTab('items');
      setFormError(null);
    }
  }, [receipt, isOpen]);

  if (!isOpen || !receipt) return null;

  // Real-time calculated totals
  const totals = calculateTotals(items, taxRate, discountRate, discountType);
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, cashReceived - totals.total) : 0;
  const isDeficit = paymentMethod === 'CASH' && cashReceived < totals.total && paymentStatus === 'SUDAH_LUNAS';

  // Handle Item Operations
  const handleAddItem = () => {
    const newItem: Item = {
      id: Date.now().toString(),
      name: 'Item Baru',
      quantity: 1,
      price: 10000,
      discountRate: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof Item, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === 'quantity') {
          return { ...it, quantity: Math.max(1, parseInt(value, 10) || 1) };
        }
        if (field === 'price') {
          return { ...it, price: Math.max(0, parseInt(value, 10) || 0) };
        }
        if (field === 'discountRate') {
          return { ...it, discountRate: Math.min(100, Math.max(0, parseInt(value, 10) || 0)) };
        }
        return { ...it, [field]: value };
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      setFormError('Struk harus memiliki minimal 1 item belanja.');
      setTimeout(() => setFormError(null), 3000);
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleRegenerateTxId = () => {
    setTransactionId(generateTransactionId());
  };

  const handleQuickExactCash = () => {
    setCashReceived(totals.total);
  };

  const handleQuickRoundCash = (roundTo: number) => {
    const rounded = Math.ceil(totals.total / roundTo) * roundTo;
    setCashReceived(rounded);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setFormError('Struk harus memiliki minimal 1 item belanja.');
      return;
    }

    if (!storeName.trim()) {
      setFormError('Nama toko tidak boleh kosong.');
      return;
    }

    if (!transactionId.trim()) {
      setFormError('ID Transaksi tidak boleh kosong.');
      return;
    }

    // Prepare updated receipt
    const updatedReceipt: Receipt = {
      ...receipt,
      storeName: storeName.trim(),
      storeAddress: storeAddress.trim(),
      storePhone: storePhone.trim(),
      cashierName: cashierName.trim() || 'Kasir',
      customerName: customerName.trim() || undefined,
      transactionId: transactionId.trim(),
      dateTime: dateTime || receipt.dateTime,
      items,
      taxRate,
      taxAmount: totals.taxAmount,
      discountRate,
      discountType,
      discountAmount: totals.discountAmount,
      subtotal: totals.subtotal,
      total: totals.total,
      paymentMethod,
      paymentStatus,
      cashReceived: paymentMethod === 'CASH' ? cashReceived : totals.total,
      changeAmount: paymentMethod === 'CASH' ? changeAmount : 0,
      notesHeader,
      notesFooter,
      fontFamily,
      paperSizePreset,
    };

    onSave(updatedReceipt);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="edit-receipt-modal"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Edit Struk Transaksi
                </h3>
                <span className="text-[11px] font-mono font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                  #{transactionId.split('/')[0]}
                </span>
                {receipt.isArchived && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                    Arsip
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Perbarui item belanja, nominal, informasi toko, atau rincian pembayaran langsung di riwayat ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInGenerator && (
              <button
                type="button"
                onClick={() => {
                  onOpenInGenerator(receipt);
                  onClose();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-200/70 rounded-lg transition cursor-pointer border border-slate-200"
                title="Buka struk ini di Generator POS untuk kustomisasi logo & cetak thermal"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Buka di Generator POS</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
              title="Tutup jendela edit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Sub-Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 overflow-x-auto">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'items'
                  ? 'border-slate-900 text-slate-900 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Daftar Item ({items.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('store')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'store'
                  ? 'border-slate-900 text-slate-900 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Toko & Kasir</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'payment'
                  ? 'border-slate-900 text-slate-900 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pembayaran & Pajak</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'notes'
                  ? 'border-slate-900 text-slate-900 bg-slate-50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Catatan & Tampilan</span>
            </button>
          </div>

          <div className="text-right pb-2 pr-1 hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-medium">Total Terkini</span>
            <span className="text-sm font-mono font-bold text-slate-900">
              {formatCurrency(totals.total, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Error Feedback Banner */}
        {formError && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: ITEM LIST & QUANTITY */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Barang / Item Belanja</h4>
                  <p className="text-xs text-slate-500">Sesuaikan nama barang, kuantitas, harga satuan, atau diskon item.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                  id="btn-modal-add-item"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Item</span>
                </button>
              </div>

              {/* Items Table Container */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Nama Barang</th>
                        <th className="py-2.5 px-3 w-28 text-center">Qty</th>
                        <th className="py-2.5 px-3 w-36">Harga Satuan ({currencySymbol})</th>
                        <th className="py-2.5 px-3 w-28 text-center">Diskon Item (%)</th>
                        <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 w-12 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => {
                        const itemGross = item.price * item.quantity;
                        const itemDisc = Math.round(itemGross * ((item.discountRate || 0) / 100));
                        const itemNet = Math.max(0, itemGross - itemDisc);

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/70 transition">
                            {/* Item Name */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                                placeholder="Nama barang..."
                                required
                              />
                            </td>

                            {/* Quantity Controls */}
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                  className="w-12 text-center py-1 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(item.id, 'quantity', item.quantity + 1)}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Price */}
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="500"
                                value={item.price}
                                onChange={(e) => handleUpdateItem(item.id, 'price', e.target.value)}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                              />
                            </td>

                            {/* Discount Rate */}
                            <td className="py-2 px-3 text-center">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.discountRate || 0}
                                  onChange={(e) => handleUpdateItem(item.id, 'discountRate', e.target.value)}
                                  className="w-16 text-center py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-1 focus:ring-slate-900 outline-none"
                                />
                                <span className="ml-1 text-[11px] text-slate-400 font-bold">%</span>
                              </div>
                            </td>

                            {/* Subtotal */}
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                              {formatCurrency(itemNet, currencySymbol)}
                              {itemDisc > 0 && (
                                <span className="block text-[10px] text-rose-500 font-normal">
                                  Hemat {formatCurrency(itemDisc, currencySymbol)}
                                </span>
                              )}
                            </td>

                            {/* Delete Item */}
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Hapus item ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subtotal preview notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">
                  Total {items.length} item ({items.reduce((acc, i) => acc + i.quantity, 0)} pcs)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  Subtotal: {formatCurrency(totals.subtotal, currencySymbol)}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: STORE & TRANSACTION META */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Informasi Toko & Kasir</h4>
                <p className="text-xs text-slate-500">Ubah identitas toko, nomor transaksi, nama kasir, atau pelanggan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" /> Nama Toko / Usaha
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    placeholder="Contoh: KOPI SENJA CIPUTAT"
                    required
                  />
                </div>

                {/* Store Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> No. Telepon Toko
                  </label>
                  <input
                    type="text"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    placeholder="Contoh: 021-7401234 / 0812-XXXX-XXXX"
                  />
                </div>

                {/* Store Address */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Alamat Lengkap Toko</label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    placeholder="Contoh: Jl. Raya Ciputat No. 42, Tangerang Selatan"
                  />
                </div>

                {/* Transaction ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" /> No. Bon / ID Transaksi
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerateTxId}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                      title="Acak ID Transaksi Baru"
                    >
                      <RefreshCw className="w-3 h-3" /> Acak Baru
                    </button>
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    required
                  />
                </div>

                {/* Date Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Waktu Transaksi
                  </label>
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none cursor-pointer"
                  />
                </div>

                {/* Cashier Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Nama Kasir
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    placeholder="Nama staf kasir..."
                  />
                </div>

                {/* Customer Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Nama Pelanggan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    placeholder="Nama pelanggan / pembeli..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT, TAX & DISCOUNT */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Pembayaran, Pajak & Diskon</h4>
                <p className="text-xs text-slate-500">Atur metode pembayaran, status pelunasan, diskon struk, dan pajak PPN.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none cursor-pointer"
                  >
                    <option value="CASH">💵 Tunai (CASH)</option>
                    <option value="QRIS">📱 QRIS</option>
                    <option value="DEBIT">💳 Kartu Debit</option>
                    <option value="CREDIT">💳 Kartu Kredit</option>
                    <option value="E-WALLET">👛 E-Wallet (GoPay / OVO / ShopeePay / DANA)</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Status Pelunasan
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none cursor-pointer"
                  >
                    <option value="SUDAH_LUNAS">✅ Sudah Lunas (LUNAS)</option>
                    <option value="BELUM_LUNAS">⏳ Belum Lunas (PENDING)</option>
                    <option value="HUTANG">💸 Hutang / Bon (TEMPO)</option>
                  </select>
                </div>

                {/* Tax Rate */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-slate-400" /> Pajak / PPN (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    />
                    <div className="flex gap-1 shrink-0">
                      {[0, 10, 11, 12].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setTaxRate(rate)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                            taxRate === rate
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Overall Discount Rate & Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Diskon Transaksi Keseluruhan
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={discountRate}
                      onChange={(e) => setDiscountRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'FIXED')}
                      className="w-24 px-2 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:ring-1 focus:ring-slate-900 outline-none cursor-pointer"
                    >
                      <option value="PERCENT">% Persen</option>
                      <option value="FIXED">Rp Tetap</option>
                    </select>
                  </div>
                </div>

                {/* Cash Received (if Cash) */}
                {paymentMethod === 'CASH' && (
                  <div className="sm:col-span-2 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Bayar Tunai (Uang Diterima)
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleQuickExactCash}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded cursor-pointer"
                        >
                          Uang Pas ({formatCurrency(totals.total, currencySymbol)})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRoundCash(50000)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded cursor-pointer"
                        >
                          50rb
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRoundCash(100000)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded cursor-pointer"
                        >
                          100rb
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                        />
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-xs text-slate-500 font-medium">Kembalian:</span>
                        <span className={`text-sm font-mono font-bold ${
                          isDeficit ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {isDeficit ? (
                            `Kurang ${formatCurrency(totals.total - cashReceived, currencySymbol)}`
                          ) : (
                            formatCurrency(changeAmount, currencySymbol)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOTES & FONT/PAPER APPEARANCE */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Catatan & Opsi Tampilan Struk</h4>
                <p className="text-xs text-slate-500">Kustomisasi teks footer/header struk, font thermal, serta lebar kertas.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Notes Header */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Catatan Atas (Header Note)</label>
                  <textarea
                    rows={3}
                    value={notesHeader}
                    onChange={(e) => setNotesHeader(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none resize-none font-mono"
                    placeholder="Contoh: PT. SENJA ABADI INTERNASIONAL..."
                  />
                </div>

                {/* Notes Footer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Catatan Bawah (Footer Note)</label>
                  <textarea
                    rows={3}
                    value={notesFooter}
                    onChange={(e) => setNotesFooter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none resize-none font-mono"
                    placeholder="Contoh: TERIMA KASIH ATAS KUNJUNGAN ANDA..."
                  />
                </div>

                {/* Font Family Option */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-slate-400" /> Gaya Huruf (Font Thermal)
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value as ReceiptFontFamily)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none cursor-pointer"
                  >
                    {RECEIPT_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Paper Size Preset */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-slate-400" /> Ukuran Kertas Thermal
                  </label>
                  <select
                    value={paperSizePreset}
                    onChange={(e) => setPaperSizePreset(e.target.value as ReceiptPaperSizePreset)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 outline-none cursor-pointer"
                  >
                    {PAPER_SIZE_OPTIONS.map((paper) => (
                      <option key={paper.id} value={paper.id}>
                        {paper.name} ({paper.widthMm}mm) - {paper.tag}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Bottom Summary Box */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Subtotal Kotor</span>
                <span className="font-mono font-bold">{formatCurrency(totals.subtotal, currencySymbol)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Total Diskon</span>
                <span className="font-mono font-bold text-amber-300">
                  {totals.discountAmount > 0 ? `-${formatCurrency(totals.discountAmount, currencySymbol)}` : 'Rp 0'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">PPN ({taxRate}%)</span>
                <span className="font-mono font-bold">+{formatCurrency(totals.taxAmount, currencySymbol)}</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-[10px] text-emerald-400 block uppercase tracking-wider font-extrabold">Total Tagihan</span>
                <span className="font-mono font-extrabold text-base text-white">
                  {formatCurrency(totals.total, currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
              id="btn-save-edited-receipt"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
