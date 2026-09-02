/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Receipt } from '../types';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  AlertTriangle, 
  Database, 
  FileJson, 
  Check, 
  CheckCircle2, 
  Copy, 
  HardDrive, 
  Pin, 
  Coins, 
  ShieldAlert, 
  Info,
  Layers,
  ArrowDownToLine,
  RefreshCw
} from 'lucide-react';

interface SettingsProps {
  history: Receipt[];
  receipt: Receipt;
  currencySymbol: string;
  onSetCurrencySymbol: (currency: string) => void;
  onResetAllData: () => void;
  onRestoreBackup: (backupData: {
    history?: Receipt[];
    customPresets?: any[];
    currencySymbol?: string;
    activeReceipt?: Receipt;
  }) => void;
  showToast: (message: string) => void;
}

export default function Settings({
  history,
  receipt,
  currencySymbol,
  onSetCurrencySymbol,
  onResetAllData,
  onRestoreBackup,
  showToast,
}: SettingsProps) {
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [copiedBackupJson, setCopiedBackupJson] = useState(false);
  const [storageUsageBytes, setStorageUsageBytes] = useState<number>(0);
  const [customPresetsCount, setCustomPresetsCount] = useState<number>(0);
  const [importFeedback, setImportFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate storage usage and custom presets
  useEffect(() => {
    calculateStorageUsage();
  }, [history]);

  const calculateStorageUsage = () => {
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          totalBytes += (key.length + value.length) * 2; // 2 bytes per char in UTF-16
        }
      }
      setStorageUsageBytes(totalBytes);

      const presetsRaw = localStorage.getItem('strukku_custom_presets');
      if (presetsRaw) {
        const parsed = JSON.parse(presetsRaw);
        setCustomPresetsCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setCustomPresetsCount(0);
      }
    } catch (e) {
      console.error('Error computing storage usage:', e);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pinnedReceiptsCount = history.filter(item => item.isPinned || item.isFavorite).length;

  // Build the complete full backup object
  const generateFullBackupData = () => {
    let customPresets: any[] = [];
    try {
      const presetsRaw = localStorage.getItem('strukku_custom_presets');
      if (presetsRaw) {
        customPresets = JSON.parse(presetsRaw);
      }
    } catch (e) {
      console.error('Error fetching presets for backup:', e);
    }

    const backupPayload = {
      app: 'STRUKKU POS',
      appVersion: '2.5',
      exportDate: new Date().toISOString(),
      metadata: {
        totalTransactions: history.length,
        pinnedTransactions: pinnedReceiptsCount,
        totalCustomPresets: customPresets.length,
        defaultCurrency: currencySymbol,
      },
      settings: {
        currency: currencySymbol,
      },
      customPresets: customPresets,
      history: history,
      activeDraftReceipt: receipt,
    };

    return backupPayload;
  };

  // 1. Download Backup JSON File
  const handleDownloadFullBackup = () => {
    try {
      const backupData = generateFullBackupData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
      
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `strukku-pos-backup-lengkap-${dateStr}_${timeStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('📦 Berkas Cadangan Penuh (Full Backup JSON) berhasil diunduh!');
    } catch (e) {
      console.error('Error generating backup download:', e);
      showToast('Gagal membuat berkas cadangan JSON.');
    }
  };

  // 2. Copy Backup JSON to clipboard
  const handleCopyBackupJson = async () => {
    try {
      const backupData = generateFullBackupData();
      await navigator.clipboard.writeText(JSON.stringify(backupData, null, 2));
      setCopiedBackupJson(true);
      showToast('📋 Data JSON cadangan berhasil disalin ke papan klip!');
      setTimeout(() => setCopiedBackupJson(false), 3000);
    } catch (e) {
      showToast('Gagal menyalin data ke clipboard.');
    }
  };

  // 3. Handle File Upload / Restore Backup
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Detect if it's a full backup or a legacy history array
        let importedHistory: Receipt[] = [];
        let importedPresets: any[] = [];
        let importedCurrency: string | undefined;
        let importedActiveReceipt: Receipt | undefined;

        if (Array.isArray(parsed)) {
          // Legacy array of receipts
          importedHistory = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // Modern full backup
          if (Array.isArray(parsed.history)) {
            importedHistory = parsed.history;
          }
          if (Array.isArray(parsed.customPresets)) {
            importedPresets = parsed.customPresets;
          }
          if (parsed.settings?.currency || parsed.currency) {
            importedCurrency = parsed.settings?.currency || parsed.currency;
          }
          if (parsed.activeDraftReceipt && typeof parsed.activeDraftReceipt === 'object') {
            importedActiveReceipt = parsed.activeDraftReceipt;
          }
        }

        if (importedHistory.length === 0 && importedPresets.length === 0 && !importedCurrency) {
          setImportFeedback({
            type: 'error',
            message: 'Format file JSON tidak valid atau tidak memiliki data transaksi/preset STRUKKU.',
          });
          return;
        }

        // Execute restore
        onRestoreBackup({
          history: importedHistory,
          customPresets: importedPresets,
          currencySymbol: importedCurrency,
          activeReceipt: importedActiveReceipt,
        });

        calculateStorageUsage();

        setImportFeedback({
          type: 'success',
          message: `Berhasil memulihkan: ${importedHistory.length} struk (${importedHistory.filter(i => i.isPinned || i.isFavorite).length} ter-pin), ${importedPresets.length} preset kustom!`,
        });

        showToast(`🎉 Data cadangan berhasil dipulihkan ke aplikasi!`);

        // Reset file input value
        if (event.target) event.target.value = '';
      } catch (err) {
        console.error('Error parsing JSON backup file:', err);
        setImportFeedback({
          type: 'error',
          message: 'Gagal membaca berkas. Pastikan file berformat JSON yang valid.',
        });
      }
    };

    reader.readAsText(file);
  };

  // 4. Handle Factory Reset
  const handleExecuteResetAll = () => {
    setShowResetConfirmModal(false);
    setResetConfirmInput('');
    onResetAllData();
    calculateStorageUsage();
    showToast('⚠️ Seluruh data LocalStorage berhasil dibersihkan ke bawaan pabrik.');
  };

  return (
    <div className="space-y-6" id="settings-view-panel">
      {/* Page Title & Intro */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <SettingsIcon className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-2">
              Pengaturan & Cadangan Data
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Penyimpanan Lokal
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola data offline browser, lakukan pencadangan lengkap (termasuk preset & struk pin), atau reset total sistem.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={calculateStorageUsage}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          title="Perbarui data penggunaan penyimpanan"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Ukuran Data</span>
        </button>
      </div>

      {/* Storage Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Transaksi</span>
            <Database className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-display">
            {history.length}
          </div>
          <p className="text-[10px] text-slate-400">Tersimpan di ledger</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Struk Di-Pin</span>
            <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-600 font-display">
            {pinnedReceiptsCount}
          </div>
          <p className="text-[10px] text-slate-400">Favorit di posisi atas</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Preset Kustom</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-extrabold text-indigo-700 font-display">
            {customPresetsCount}
          </div>
          <p className="text-[10px] text-slate-400">Template toko tersimpan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ukuran Memori</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 font-display">
            {formatBytes(storageUsageBytes)}
          </div>
          <p className="text-[10px] text-slate-400">LocalStorage browser</p>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* CARD 1: BACKUP SEMUA DATA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5" id="section-backup-data">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  BackUp Semua Data (JSON)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simpan cadangan komprehensif seluruh data Anda ke file lokal.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
              .json
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yang Tercakup dalam Cadangan Ini:
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>Seluruh <strong>{history.length} Riwayat Struk</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Status <strong>{pinnedReceiptsCount} Struk Ter-Pin</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Semua <strong>{customPresetsCount} Preset Kustom Toko</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>Preferensi Mata Uang (<strong>{currencySymbol}</strong>)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>Label Kustom & Kustomisasi Teks</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                <span>Draf Aktif Generator Saat Ini</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadFullBackup}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
              id="btn-download-full-backup"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Unduh Berkas Cadangan (.JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyBackupJson}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              title="Salin isi data JSON langsung ke clipboard"
            >
              {copiedBackupJson ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Salin JSON</span>
                </>
              )}
            </button>
          </div>

          {/* RESTORE SECTION */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-slate-700" /> Pulihkan dari File Cadangan
              </label>
              <span className="text-[10px] text-slate-400">Pilih berkas .json</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json,application/json"
              className="hidden"
              id="settings-import-file-input"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 text-slate-500" />
              <span>Klik untuk Upload & Pulihkan File JSON</span>
            </button>

            {importFeedback.type && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                importFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {importFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <span>{importFeedback.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: PREFERENSI MATA UANG & RESET SEMUA DATA */}
        <div className="space-y-6">
          
          {/* PREFERENSI MATA UANG */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Mata Uang Default
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simbol mata uang yang digunakan pada struk dan perhitungan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: 'Rupiah (Rp)', val: 'Rp' },
                { label: 'Dolar ($)', val: '$' },
                { label: 'Euro (€)', val: '€' },
                { label: 'Ringgit (RM)', val: 'RM' },
                { label: 'Yen (¥)', val: '¥' },
                { label: 'Sing Dollar (S$)', val: 'S$' },
                { label: 'Pound (£)', val: '£' },
                { label: 'Tanpa Simbol', val: '' },
              ].map((curr) => (
                <button
                  key={curr.val}
                  type="button"
                  onClick={() => {
                    onSetCurrencySymbol(curr.val);
                    showToast(`Mata uang diatur ke: ${curr.label}`);
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                    currencySymbol === curr.val
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="truncate">{curr.label}</span>
                  {currencySymbol === curr.val && <Check className="w-3 h-3 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* DANGER ZONE: RESET SEMUA DATA (FACTORY RESET) */}
          <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-xs space-y-4" id="section-danger-reset">
            <div className="flex items-center gap-2.5 pb-3 border-b border-rose-100">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wide">
                  Reset Semua Data (Factory Reset)
                </h3>
                <p className="text-xs text-rose-500 mt-0.5">
                  Menghapus total seluruh data yang tersimpan di LocalStorage browser.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                Tindakan ini tidak dapat dibatalkan:
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700">
                Mengeksekusi reset akan menghapus seluruh riwayat transaksi ({history.length}), semua struk yang di-pin ({pinnedReceiptsCount}), preset kustom toko ({customPresetsCount}), dan pengaturan mata uang. Disarankan untuk mengunduh <strong>BackUp Semua Data</strong> terlebih dahulu.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setResetConfirmInput('');
                setShowResetConfirmModal(true);
              }}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
              id="btn-trigger-factory-reset"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Semua Data Sekarang</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODAL KONFIRMASI RESET TOTAL */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  Konfirmasi Reset Semua Data
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus seluruh data di LocalStorage browser? Semua {history.length} struk dan {customPresetsCount} preset kustom akan terhapus permanen.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                Ketik <span className="font-mono text-rose-600 font-bold">RESET</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="Ketik RESET di sini"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 outline-none font-bold"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirmModal(false);
                  setResetConfirmInput('');
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleExecuteResetAll}
                disabled={resetConfirmInput.trim().toUpperCase() !== 'RESET'}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  resetConfirmInput.trim().toUpperCase() === 'RESET'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
