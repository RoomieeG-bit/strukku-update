/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Receipt } from '../types';
import { formatCurrency, formatDateTime } from '../utils';
import { 
  Search, 
  Trash2, 
  ArrowUpRight, 
  Calendar, 
  DollarSign, 
  Store, 
  Tag, 
  Download, 
  Upload, 
  RefreshCw, 
  History,
  CheckCircle2,
  FileSpreadsheet,
  X,
  User,
  ShoppingBag,
  Filter,
  Copy,
  Check,
  Pin,
  PinOff,
  Star,
  Bookmark,
  RotateCcw,
  Clock,
  AlertTriangle,
  ArchiveRestore,
  Info
} from 'lucide-react';

interface ReceiptHistoryProps {
  history: Receipt[];
  trashHistory?: Receipt[];
  onLoadReceipt: (receipt: Receipt) => void;
  onTogglePinReceipt?: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onClearHistory: () => void;
  onRestoreReceipt?: (id: string) => void;
  onRestoreAllTrash?: () => void;
  onPermanentDeleteReceipt?: (id: string) => void;
  onEmptyTrash?: () => void;
  onImportHistory: (imported: Receipt[]) => void;
  currencySymbol: string;
}

export default function ReceiptHistory({
  history,
  trashHistory = [],
  onLoadReceipt,
  onTogglePinReceipt,
  onDeleteReceipt,
  onClearHistory,
  onRestoreReceipt,
  onRestoreAllTrash,
  onPermanentDeleteReceipt,
  onEmptyTrash,
  onImportHistory,
  currencySymbol,
}: ReceiptHistoryProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [trashSearchTerm, setTrashSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'rose' | 'emerald' | 'slate';
    onConfirm: () => void;
  } | null>(null);

  // Directly and reliably restore all receipts from trash back to active history
  const handleTriggerRestoreAll = () => {
    if (trashHistory.length === 0) return;
    onRestoreAllTrash?.();
    setActiveTab('active');
    setTrashSearchTerm('');
  };

  const pinnedCount = history.filter((item) => item.isPinned || item.isFavorite).length;

  // Filter active history list
  const filteredHistory = history.filter((item) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      item.transactionId.toLowerCase().includes(term) ||
      (item.customerName && item.customerName.toLowerCase().includes(term)) ||
      item.storeName.toLowerCase().includes(term) ||
      item.cashierName.toLowerCase().includes(term) ||
      item.items.some((i) => 
        i.name.toLowerCase().includes(term) || 
        (i.id && i.id.toLowerCase().includes(term))
      );

    const matchesMethod = 
      methodFilter === 'ALL' || 
      (methodFilter === 'PINNED' && (item.isPinned || item.isFavorite)) ||
      item.paymentMethod === methodFilter || 
      (item.paymentStatus || 'SUDAH_LUNAS') === methodFilter;
    
    const matchesDate = !dateFilter || item.dateTime.startsWith(dateFilter);

    return matchesSearch && matchesMethod && matchesDate;
  });

  // Sort active history: pinned items always float to the top
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    const isAPinned = Boolean(a.isPinned || a.isFavorite);
    const isBPinned = Boolean(b.isPinned || b.isFavorite);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return 0; // maintain original chronological order
  });

  // Filter trash list
  const filteredTrashHistory = (trashHistory || []).filter((item) => {
    const term = trashSearchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      item.transactionId.toLowerCase().includes(term) ||
      (item.customerName && item.customerName.toLowerCase().includes(term)) ||
      item.storeName.toLowerCase().includes(term) ||
      item.cashierName.toLowerCase().includes(term) ||
      item.items.some((i) => 
        i.name.toLowerCase().includes(term) || 
        (i.id && i.id.toLowerCase().includes(term))
      )
    );
  });

  // Calculate stats on active list
  const totalRevenue = filteredHistory.reduce((sum, item) => sum + item.total, 0);
  const totalItemsSold = filteredHistory.reduce(
    (sum, item) => sum + item.items.reduce((acc, i) => acc + i.quantity, 0),
    0
  );

  // Calculate stats on trash list
  const totalTrashRevenue = (trashHistory || []).reduce((sum, item) => sum + item.total, 0);

  const handleCopyTransactionId = (e: React.MouseEvent, txId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(txId);
    setCopiedId(txId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setMethodFilter('ALL');
    setDateFilter('');
  };

  // Backup history as JSON file download
  const handleExportJSON = () => {
    if (history.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Strukku_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore history from JSON backup file upload
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        setImportError(null);
        setImportSuccess(false);
        const parsed = JSON.parse(event.target?.result as string);
        
        // Simple structure validation
        if (Array.isArray(parsed) && (parsed.length === 0 || (parsed[0].transactionId && parsed[0].items))) {
          onImportHistory(parsed);
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Format berkas tidak valid. Harap gunakan berkas JSON Strukku yang sah.');
        }
      } catch (err) {
        setImportError('Gagal membaca berkas. Pastikan berkas berupa JSON yang sah.');
      }
    };
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full" id="receipt-history-panel">
      {/* Header with Title and Tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl transition shadow-2xs ${
              activeTab === 'trash' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
            }`}>
              {activeTab === 'trash' ? <Trash2 className="w-5 h-5" /> : <History className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 font-display text-sm sm:text-base">
                {activeTab === 'trash' ? 'Kotak Sampah Struk' : 'Riwayat Transaksi'}
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {activeTab === 'trash' 
                  ? 'Struk yang dihapus tersimpan di sini & bisa dipulihkan kembali' 
                  : 'Laporan penjualan & arsip transaksi tersimpan'}
              </span>
            </div>
          </div>

          {/* Tab Pill Selector with clear separation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer border ${
                activeTab === 'active'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              id="tab-history-active"
            >
              <History className="w-3.5 h-3.5" />
              <span>Semua Riwayat</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {history.length}
              </span>
            </button>

            {/* Visual Divider / Spacer */}
            <div className="h-5 w-px bg-slate-200 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer border ${
                activeTab === 'trash'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-600 hover:text-rose-700 border-slate-200 hover:border-rose-200 hover:bg-rose-50/60'
              }`}
              id="tab-history-trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sampah</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'trash'
                  ? 'bg-white text-rose-700'
                  : trashHistory.length > 0
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600'
              }`}>
                {trashHistory.length}
              </span>
            </button>
          </div>
        </div>

        {/* Action Controls for active Tab */}
        {activeTab === 'active' ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              disabled={history.length === 0}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Download Backup Riwayat (.json)"
            >
              <Download className="w-3.5 h-3.5" /> Ekspor
            </button>
            
            <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5" /> Impor
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportJSON} 
                className="hidden" 
              />
            </label>

            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Pindahkan Semua ke Sampah?',
                    message: `Seluruh (${history.length}) riwayat transaksi aktif akan dipindahkan ke tab Sampah. Anda dapat memulihkannya kembali kapan saja.`,
                    confirmLabel: 'Pindahkan ke Sampah',
                    variant: 'rose',
                    onConfirm: () => onClearHistory(),
                  });
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-rose-100"
                title="Pindahkan Semua ke Sampah"
              >
                <Trash2 className="w-3.5 h-3.5" /> Pindahkan Semua ke Sampah
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {trashHistory.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleTriggerRestoreAll}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                  title="Pulihkan Seluruh Struk dari Sampah ke Riwayat Aktif"
                  id="btn-restore-all-trash"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan Semua ({trashHistory.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Kosongkan Kotak Sampah?',
                      message: `Hapus permanen semua (${trashHistory.length}) struk di kotak Sampah? Tindakan ini TIDAK DAPAT DIBATALKAN dan data akan hilang selamanya.`,
                      confirmLabel: 'Kosongkan Sampah',
                      variant: 'rose',
                      onConfirm: () => onEmptyTrash?.(),
                    });
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                  title="Kosongkan Semua Sampah Secara Permanen"
                  id="btn-empty-trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kosongkan Sampah</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Backup Feedback Banner */}
      {importError && (
        <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-medium">
          ⚠️ {importError}
        </div>
      )}
      {importSuccess && (
        <div className="mx-5 mt-4 p-3 bg-slate-900/5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-slate-900" /> Riwayat transaksi berhasil diimpor!
        </div>
      )}

      {/* TAB CONTENT 1: RIWAYAT AKTIF */}
      {activeTab === 'active' && (
        <>
          {/* Filter and Search Bar Section */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
            {/* Main Search Input Field */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Cari ID Transaksi, Nama Pelanggan, Kasir, atau Item Barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/15 focus:border-slate-900 outline-none transition shadow-2xs"
                id="history-search-input"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Hapus kata pencarian"
                  id="clear-search-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filters and Search Status Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-[260px]">
                <div>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-medium text-slate-700 cursor-pointer"
                    id="history-method-filter"
                  >
                    <option value="ALL">💳 Semua Metode & Status</option>
                    <option value="PINNED">📌 Khusus Disematkan / Favorit ({pinnedCount})</option>
                    <option value="CASH">💵 Tunai (CASH)</option>
                    <option value="QRIS">📱 QRIS / E-Wallet</option>
                    <option value="DEBIT">💳 Kartu Debit</option>
                    <option value="CREDIT">💳 Kartu Kredit</option>
                    <option value="SUDAH_LUNAS">✅ Sudah Lunas</option>
                    <option value="BELUM_LUNAS">⏳ Belum Lunas</option>
                    <option value="HUTANG">💸 Hutang</option>
                  </select>
                </div>

                <div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none cursor-pointer"
                    id="history-date-filter"
                  />
                </div>
              </div>

              {/* Results Count, Quick Pinned Filter & Reset Filter Indicator */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {pinnedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setMethodFilter(prev => prev === 'PINNED' ? 'ALL' : 'PINNED')}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer border ${
                      methodFilter === 'PINNED'
                        ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    }`}
                    title="Tampilkan hanya struk yang disematkan / di-pin"
                  >
                    <Pin className={`w-3 h-3 ${methodFilter === 'PINNED' ? 'fill-slate-950' : 'fill-amber-600'}`} />
                    <span>Disematkan ({pinnedCount})</span>
                  </button>
                )}

                <span className="text-slate-500 font-medium">
                  <span className="font-bold text-slate-900">{filteredHistory.length}</span> dari {history.length} transaksi
                </span>
                {(searchTerm || methodFilter !== 'ALL' || dateFilter) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer"
                    id="reset-all-filters-btn"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <History className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  {searchTerm || methodFilter !== 'ALL' || dateFilter
                    ? 'Tidak ada transaksi yang cocok'
                    : 'Belum ada riwayat transaksi'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {searchTerm || methodFilter !== 'ALL' || dateFilter 
                    ? `Tidak ditemukan transaksi dengan filter yang dipilih. Coba ubah atau bersihkan filter pencarian.` 
                    : 'Struk yang Anda buat di tab generator akan tersimpan secara otomatis di sini.'}
                </p>
                {(searchTerm || methodFilter !== 'ALL' || dateFilter) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-4 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3" /> Bersihkan Filter & Cari Ulang
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100" id="history-items-list">
                {sortedHistory.map((item) => {
                  const isPinned = Boolean(item.isPinned || item.isFavorite);

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 transition flex flex-col md:flex-row justify-between md:items-center gap-3 ${
                        isPinned 
                          ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-400' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Store details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {isPinned && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
                              <Pin className="w-3 h-3 fill-slate-950" /> Tersemat di Atas
                            </span>
                          )}
                          <span className="font-bold text-slate-800 text-sm truncate font-display">
                            {item.storeName}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            item.paymentMethod === 'CASH'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {item.paymentMethod}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            (item.paymentStatus || 'SUDAH_LUNAS') === 'SUDAH_LUNAS'
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : (item.paymentStatus || 'SUDAH_LUNAS') === 'BELUM_LUNAS'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                          }`}>
                            {(item.paymentStatus || 'SUDAH_LUNAS') === 'SUDAH_LUNAS' ? 'Lunas' :
                             (item.paymentStatus || 'SUDAH_LUNAS') === 'BELUM_LUNAS' ? 'Belum Lunas' : 'Hutang'}
                          </span>
                          {item.fontFamily && item.fontFamily !== 'DEFAULT' && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                              {item.fontFamily === 'EAS' ? 'EAS Alert' : item.fontFamily === 'RETRO_TERMINAL' ? '8-Bit CRT' : item.fontFamily === 'DOT_MATRIX' ? 'Dot Matrix' : item.fontFamily}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-[10px] text-slate-700 truncate font-semibold" title={item.transactionId}>
                              {item.transactionId}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyTransactionId(e, item.transactionId)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Salin ID Transaksi"
                            >
                              {copiedId === item.transactionId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {item.customerName ? (
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate font-medium text-slate-700" title={`Pelanggan: ${item.customerName}`}>
                                {item.customerName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <span className="truncate text-slate-400" title={`Kasir: ${item.cashierName}`}>
                                Kasir: {item.cashierName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{formatDateTime(item.dateTime).split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">
                              {item.items.reduce((sum, i) => sum + i.quantity, 0)} pcs ({item.items.length} item)
                            </span>
                          </div>
                        </div>

                        {/* List of short preview items */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.items.slice(0, 4).map((it, idx) => {
                            const isItemMatched = searchTerm && it.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
                            return (
                              <span 
                                key={idx} 
                                onClick={() => setSearchTerm(it.name)}
                                className={`text-[10px] px-2 py-0.5 rounded-full transition cursor-pointer ${
                                  isItemMatched 
                                    ? 'bg-slate-900 text-white font-bold' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title={`Cari transaksi yang memiliki item "${it.name}"`}
                              >
                                {it.name} x{it.quantity}
                              </span>
                            );
                          })}
                          {item.items.length > 4 && (
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              +{item.items.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side Amount and Actions */}
                      <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Total Belanja</span>
                          <span className="text-sm font-mono font-bold text-slate-900 block">
                            {formatCurrency(item.total, currencySymbol)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Toggle Pin / Favorite Button */}
                          <button
                            type="button"
                            onClick={() => onTogglePinReceipt?.(item.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                              isPinned
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs font-bold'
                                : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-900 hover:border-amber-200 border border-transparent'
                            }`}
                            title={isPinned ? 'Lepas Sematan (Unpin)' : 'Sematkan Struk ke Paling Atas (Pin)'}
                          >
                            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-600 text-amber-800' : 'text-slate-400'}`} />
                            <span className="hidden sm:inline">{isPinned ? 'Tersemat' : 'Pin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onLoadReceipt(item)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Muat kembali ke generator POS"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" /> Muat
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteReceipt(item.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Pindahkan Struk ke Sampah (Dapat dipulihkan lagi)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ledger Stats Bar */}
          {filteredHistory.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center shrink-0">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Omset</span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {formatCurrency(totalRevenue, currencySymbol)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Struk Terpilih</span>
                <span className="text-sm font-bold text-slate-800">
                  {filteredHistory.length} Transaksi
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Transaksi</span>
                <span className="text-sm font-mono font-bold text-slate-800">
                  {formatCurrency(totalRevenue / filteredHistory.length, currencySymbol)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT 2: KOTAK SAMPAH (STRUK YANG DIHAPUS & BISA DIPULIHKAN) */}
      {activeTab === 'trash' && (
        <>
          {/* Trash Information Banner & Search Input */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
            <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                  <ArchiveRestore className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-950">Kotak Sampah & Pemulihan Struk</h4>
                  <p className="text-[11px] text-rose-800/90 mt-0.5 leading-relaxed">
                    Struk yang Anda hapus dari riwayat aman tersimpan di sini. Klik tombol <strong>Pulihkan</strong> pada struk mana pun untuk mengembalikannya ke tab <strong>Semua Riwayat</strong> dengan utuh.
                  </p>
                </div>
              </div>

              {trashHistory.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleTriggerRestoreAll}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                    title="Pulihkan seluruh struk dari Sampah ke Riwayat Aktif"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan Semua</span>
                  </button>
                  <span className="hidden sm:inline-block text-[11px] font-bold text-rose-700 bg-white px-2.5 py-1.5 rounded-lg border border-rose-200 shadow-2xs">
                    {trashHistory.length} Struk di Sampah
                  </span>
                </div>
              )}
            </div>

            {/* Trash Search Input */}
            {trashHistory.length > 0 && (
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Cari struk di sampah berdasarkan ID Transaksi, Toko, Pelanggan, Kasir, atau Item..."
                  value={trashSearchTerm}
                  onChange={(e) => setTrashSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50/70 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition shadow-2xs"
                  id="trash-search-input"
                  autoComplete="off"
                />
                {trashSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setTrashSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Hapus kata pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Trash Items List */}
          <div className="flex-1 overflow-y-auto">
            {trashHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                  <Trash2 className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">Kotak Sampah Kosong</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                  Tidak ada struk yang dihapus. Jika Anda menghapus transaksi dari riwayat, struk akan tersimpan di sini dan dapat dipulihkan kembali kapan saja.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('active')}
                  className="mt-4 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <History className="w-3.5 h-3.5" /> Kembali ke Riwayat Transaksi
                </button>
              </div>
            ) : filteredTrashHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                <Search className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">Tidak ada struk sampah yang cocok</p>
                <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                <button
                  type="button"
                  onClick={() => setTrashSearchTerm('')}
                  className="mt-3 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Bersihkan Pencarian
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100" id="trash-items-list">
                {filteredTrashHistory.map((item) => {
                  return (
                    <div 
                      key={item.id}
                      className="p-4 transition flex flex-col md:flex-row justify-between md:items-center gap-3 hover:bg-rose-50/30 bg-white"
                      id={`trash-item-${item.id}`}
                    >
                      {/* Store & Metadata Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                            SAMPAH
                          </span>
                          <span className="font-bold text-slate-800 text-sm truncate font-display">
                            {item.storeName}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {item.paymentMethod}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            (item.paymentStatus || 'SUDAH_LUNAS') === 'SUDAH_LUNAS'
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {(item.paymentStatus || 'SUDAH_LUNAS') === 'SUDAH_LUNAS' ? 'Lunas' : 'Belum Lunas'}
                          </span>
                          
                          {/* Deleted Timestamp */}
                          <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-100">
                            <Clock className="w-3 h-3 text-rose-500" />
                            <span>Dihapus: {item.deletedAt ? formatDateTime(item.deletedAt) : 'Baru saja'}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-[10px] text-slate-700 truncate font-semibold" title={item.transactionId}>
                              {item.transactionId}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyTransactionId(e, item.transactionId)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title="Salin ID Transaksi"
                            >
                              {copiedId === item.transactionId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {item.customerName ? (
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate font-medium text-slate-700" title={`Pelanggan: ${item.customerName}`}>
                                {item.customerName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                              <span className="truncate text-slate-400" title={`Kasir: ${item.cashierName}`}>
                                Kasir: {item.cashierName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Tgl Transaksi: {formatDateTime(item.dateTime).split(' ')[0]}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">
                              {item.items.reduce((sum, i) => sum + i.quantity, 0)} pcs ({item.items.length} item)
                            </span>
                          </div>
                        </div>

                        {/* List of short preview items */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.items.slice(0, 4).map((it, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                            >
                              {it.name} x{it.quantity}
                            </span>
                          ))}
                          {item.items.length > 4 && (
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              +{item.items.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side Amount and Restore Actions */}
                      <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">Total Belanja</span>
                          <span className="text-sm font-mono font-bold text-slate-900 block">
                            {formatCurrency(item.total, currencySymbol)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Pulihkan Button */}
                          <button
                            type="button"
                            onClick={() => onRestoreReceipt?.(item.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                            title="Pulihkan struk ini kembali ke Riwayat Transaksi"
                            id={`restore-btn-${item.id}`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pulihkan</span>
                          </button>

                          {/* Hapus Permanen Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Hapus Permanen Struk?',
                                message: `Hapus permanen struk #${item.transactionId} (${item.storeName})? Data tidak dapat dipulihkan lagi setelah dihapus permanen.`,
                                confirmLabel: 'Hapus Permanen',
                                variant: 'rose',
                                onConfirm: () => onPermanentDeleteReceipt?.(item.id),
                              });
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-rose-200/60"
                            title="Hapus struk ini secara permanen dari Sampah"
                            id={`permanent-delete-btn-${item.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus Permanen</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trash Bottom Stats Bar */}
          {trashHistory.length > 0 && (
            <div className="bg-rose-50/50 border-t border-rose-100 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center shrink-0">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Struk di Sampah</span>
                <span className="text-sm font-bold text-rose-950">
                  {trashHistory.length} Transaksi
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Total Nilai Sampah</span>
                <span className="text-sm font-mono font-bold text-rose-950">
                  {formatCurrency(totalTrashRevenue, currencySymbol)}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-rose-200/70 pt-2 sm:pt-0">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Status Pemulihan</span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Siap Dipulihkan Kapan Saja
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* In-App Confirmation Modal (Bypasses iframe window.confirm limitations) */}
      {confirmModal && confirmModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                confirmModal.variant === 'rose'
                  ? 'bg-rose-100 text-rose-600'
                  : confirmModal.variant === 'emerald'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-800'
              }`}>
                {confirmModal.variant === 'rose' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  action();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-xs active:scale-95 ${
                  confirmModal.variant === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmModal.variant === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
