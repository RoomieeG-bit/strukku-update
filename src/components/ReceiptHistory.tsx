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
  FileSpreadsheet
} from 'lucide-react';

interface ReceiptHistoryProps {
  history: Receipt[];
  onLoadReceipt: (receipt: Receipt) => void;
  onDeleteReceipt: (id: string) => void;
  onClearHistory: () => void;
  onImportHistory: (imported: Receipt[]) => void;
  currencySymbol: string;
}

export default function ReceiptHistory({
  history,
  onLoadReceipt,
  onDeleteReceipt,
  onClearHistory,
  onImportHistory,
  currencySymbol,
}: ReceiptHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Filter and search history list
  const filteredHistory = history.filter((item) => {
    const matchesSearch = 
      item.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMethod = methodFilter === 'ALL' || 
      item.paymentMethod === methodFilter || 
      (item.paymentStatus || 'SUDAH_LUNAS') === methodFilter;
    
    const matchesDate = !dateFilter || item.dateTime.startsWith(dateFilter);

    return matchesSearch && matchesMethod && matchesDate;
  });

  // Calculate stats on filtered list
  const totalRevenue = filteredHistory.reduce((sum, item) => sum + item.total, 0);
  const totalItemsSold = filteredHistory.reduce(
    (sum, item) => sum + item.items.reduce((acc, i) => acc + i.quantity, 0),
    0
  );

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
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-900 text-white rounded-xl">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 font-display text-sm">Riwayat Transaksi</h3>
            <span className="text-xs text-slate-500 font-medium">Laporan penjualan & manajemen kasir</span>
          </div>
        </div>

        {/* JSON Backup & Clear Operations */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={history.length === 0}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Download Backup Riwayat (.json)"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor
          </button>
          
          <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
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
                if (window.confirm('Apakah Anda yakin ingin menghapus semua riwayat struk? Tindakan ini tidak dapat dibatalkan.')) {
                  onClearHistory();
                }
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              title="Bersihkan Semua Data"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
            </button>
          )}
        </div>
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

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white shrink-0">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari Toko, Struk ID, Kasir, atau Barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
            id="history-search"
          />
        </div>

        <div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-medium text-slate-600"
            id="history-method-filter"
          >
            <option value="ALL">💳 Semua Metode / Status</option>
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-600 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
            id="history-date-filter"
          />
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
            <History className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Belum ada transaksi ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm || methodFilter !== 'ALL' || dateFilter 
                ? 'Coba bersihkan pencarian atau filter Anda.' 
                : 'Buat struk baru di tab generator lalu simpan ke riwayat.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" id="history-items-list">
            {filteredHistory.map((item) => (
              <div 
                key={item.id} 
                className="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row justify-between md:items-center gap-3"
              >
                {/* Store details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
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
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[10px] text-slate-600 truncate font-semibold" title={item.transactionId}>
                        {item.transactionId}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDateTime(item.dateTime).split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                      <span className="text-slate-400">Barang:</span>
                      <span className="font-semibold text-slate-700">
                        {item.items.reduce((sum, i) => sum + i.quantity, 0)} pcs
                      </span>
                    </div>
                  </div>

                  {/* List of short preview items */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.items.slice(0, 3).map((it, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
                        {it.name} x{it.quantity}
                      </span>
                    ))}
                    {item.items.length > 3 && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        +{item.items.length - 3} lainnya
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side Amount and Restore Actions */}
                <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Belanja</span>
                    <span className="text-sm font-mono font-bold text-slate-900 block">
                      {formatCurrency(item.total, currencySymbol)}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onLoadReceipt(item)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      title="Load kembali ke generator"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Muat
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReceipt(item.id)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="Hapus Struk dari Riwayat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
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
    </div>
  );
}
