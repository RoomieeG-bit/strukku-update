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
  RefreshCw,
  Store,
  Sparkles,
  MapPin,
  User,
  Phone
} from 'lucide-react';

interface SettingsProps {
  history: Receipt[];
  receipt: Receipt;
  currencySymbol: string;
  onSetCurrencySymbol: (currency: string) => void;
  defaultStoreName: string;
  onSetDefaultStoreName: (storeName: string, applyToCurrent?: boolean) => void;
  defaultStoreAddress?: string;
  onSetDefaultStoreAddress?: (storeAddress: string, applyToCurrent?: boolean) => void;
  defaultCashierName?: string;
  onSetDefaultCashierName?: (cashierName: string, applyToCurrent?: boolean) => void;
  defaultStorePhone?: string;
  onSetDefaultStorePhone?: (storePhone: string, applyToCurrent?: boolean) => void;
  onResetAllData: () => void;
  onRestoreBackup: (backupData: {
    history?: Receipt[];
    customPresets?: any[];
    currencySymbol?: string;
    activeReceipt?: Receipt;
    defaultStoreName?: string;
    defaultStoreAddress?: string;
    defaultCashierName?: string;
    defaultStorePhone?: string;
  }) => void;
  showToast: (message: string) => void;
}

export default function Settings({
  history,
  receipt,
  currencySymbol,
  onSetCurrencySymbol,
  defaultStoreName,
  onSetDefaultStoreName,
  defaultStoreAddress,
  onSetDefaultStoreAddress,
  defaultCashierName,
  onSetDefaultCashierName,
  defaultStorePhone,
  onSetDefaultStorePhone,
  onResetAllData,
  onRestoreBackup,
  showToast,
}: SettingsProps) {
  const [storeNameInput, setStoreNameInput] = useState(defaultStoreName);
  const [storeAddressInput, setStoreAddressInput] = useState(defaultStoreAddress || '');
  const [cashierNameInput, setCashierNameInput] = useState(defaultCashierName || 'Andi Wijaya');
  const [storePhoneInput, setStorePhoneInput] = useState(defaultStorePhone || '021-7401234');
  const [applyToCurrentReceipt, setApplyToCurrentReceipt] = useState(true);
  const [applyAddressToCurrentReceipt, setApplyAddressToCurrentReceipt] = useState(true);
  const [applyCashierToCurrentReceipt, setApplyCashierToCurrentReceipt] = useState(true);
  const [applyPhoneToCurrentReceipt, setApplyPhoneToCurrentReceipt] = useState(true);

  useEffect(() => {
    setStoreNameInput(defaultStoreName);
  }, [defaultStoreName]);

  useEffect(() => {
    if (defaultStoreAddress) {
      setStoreAddressInput(defaultStoreAddress);
    }
  }, [defaultStoreAddress]);

  useEffect(() => {
    if (defaultCashierName) {
      setCashierNameInput(defaultCashierName);
    }
  }, [defaultCashierName]);

  useEffect(() => {
    if (defaultStorePhone) {
      setStorePhoneInput(defaultStorePhone);
    }
  }, [defaultStorePhone]);
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
        defaultStoreName: defaultStoreName,
        defaultStoreAddress: defaultStoreAddress,
        defaultCashierName: defaultCashierName || 'Andi Wijaya',
        defaultStorePhone: defaultStorePhone || '021-7401234',
      },
      settings: {
        currency: currencySymbol,
        defaultStoreName: defaultStoreName,
        defaultStoreAddress: defaultStoreAddress,
        defaultCashierName: defaultCashierName || 'Andi Wijaya',
        defaultStorePhone: defaultStorePhone || '021-7401234',
      },
      defaultStoreName: defaultStoreName,
      defaultStoreAddress: defaultStoreAddress,
      defaultCashierName: defaultCashierName || 'Andi Wijaya',
      defaultStorePhone: defaultStorePhone || '021-7401234',
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
        let importedDefaultStoreName: string | undefined;
        let importedDefaultStoreAddress: string | undefined;
        let importedDefaultCashierName: string | undefined;
        let importedDefaultStorePhone: string | undefined;

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
          if (parsed.settings?.defaultStoreName || parsed.defaultStoreName) {
            importedDefaultStoreName = parsed.settings?.defaultStoreName || parsed.defaultStoreName;
          }
          if (parsed.settings?.defaultStoreAddress || parsed.defaultStoreAddress) {
            importedDefaultStoreAddress = parsed.settings?.defaultStoreAddress || parsed.defaultStoreAddress;
          }
          if (parsed.settings?.defaultCashierName || parsed.defaultCashierName) {
            importedDefaultCashierName = parsed.settings?.defaultCashierName || parsed.defaultCashierName;
          }
          if (parsed.settings?.defaultStorePhone || parsed.defaultStorePhone) {
            importedDefaultStorePhone = parsed.settings?.defaultStorePhone || parsed.defaultStorePhone;
          }
          if (parsed.activeDraftReceipt && typeof parsed.activeDraftReceipt === 'object') {
            importedActiveReceipt = parsed.activeDraftReceipt;
          }
        }

        if (importedHistory.length === 0 && importedPresets.length === 0 && !importedCurrency && !importedDefaultStoreName && !importedDefaultStoreAddress && !importedDefaultCashierName && !importedDefaultStorePhone) {
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
          defaultStoreName: importedDefaultStoreName,
          defaultStoreAddress: importedDefaultStoreAddress,
          defaultCashierName: importedDefaultCashierName,
          defaultStorePhone: importedDefaultStorePhone,
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
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Nama Toko Default (<strong>{defaultStoreName}</strong>)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Alamat Toko Default (<strong>{defaultStoreAddress || 'Belum diatur'}</strong>)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Nama Kasir Default (<strong>{defaultCashierName || 'Andi Wijaya'}</strong>)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                <span>No. Telepon Default (<strong>{defaultStorePhone || '021-7401234'}</strong>)</span>
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

        {/* CARD 2: PENGATURAN TOKO & MATA UANG & RESET */}
        <div className="space-y-6">

          {/* NAMA TOKO DEFAULT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4" id="section-default-store-name">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Store className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    Nama Toko Default
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-sans">
                      Terus Dipakai
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nama toko utama yang akan selalu digunakan secara otomatis pada kolom Nama Toko struk baru.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="input-default-store-name">
                  Nama Toko yang Terus Dipakai:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Store className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="input-default-store-name"
                      value={storeNameInput}
                      onChange={(e) => setStoreNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = storeNameInput.trim();
                          if (trimmed) {
                            onSetDefaultStoreName(trimmed, applyToCurrentReceipt);
                            showToast(`Nama Toko Default disimpan: "${trimmed}"`);
                          }
                        }
                      }}
                      placeholder="Contoh: KOPI SENJA CIPUTAT"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = storeNameInput.trim();
                      if (!trimmed) {
                        showToast('Nama toko default tidak boleh kosong.');
                        return;
                      }
                      onSetDefaultStoreName(trimmed, applyToCurrentReceipt);
                      showToast(`Nama Toko Default berhasil disimpan: "${trimmed}"`);
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 shrink-0"
                    id="btn-save-default-store-name"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Checkbox: Terapkan juga ke struk aktif */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={applyToCurrentReceipt}
                  onChange={(e) => setApplyToCurrentReceipt(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <span>Terapkan juga langsung ke struk yang sedang dibuat saat ini</span>
              </label>

              {/* Status Note */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    Nama Toko Aktif: <span className="font-mono text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">{defaultStoreName}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Setiap kali Anda menekan tombol <strong>Transaksi Baru</strong> atau memulai struk baru, nama toko ini akan langsung digunakan secara konsisten.
                  </p>
                </div>
              </div>

              {/* Quick Suggestion Presets */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Preset Cepat Nama Toko Populer:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'KOPI SENJA CIPUTAT',
                    'MINIMARKET SEJAHTERA',
                    'TOKO BERKAH JAYA',
                    'WARUNG KELONTONG ABADI',
                    'CAFE & RESTO NUSANTARA',
                    'APOTEK FARMA SEHAT'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setStoreNameInput(sug);
                        onSetDefaultStoreName(sug, applyToCurrentReceipt);
                        showToast(`Nama Toko Default diatur ke: "${sug}"`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                        defaultStoreName === sug
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sug}
                      {defaultStoreName === sug && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ALAMAT TOKO DEFAULT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4" id="section-default-store-address">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    Alamat Toko Default
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">
                      Terus Dipakai
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alamat outlet atau toko utama yang akan otomatis digunakan pada kolom Alamat Toko struk baru.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="input-default-store-address">
                  Alamat Toko yang Terus Dipakai:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="input-default-store-address"
                      value={storeAddressInput}
                      onChange={(e) => setStoreAddressInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = storeAddressInput.trim();
                          if (trimmed && onSetDefaultStoreAddress) {
                            onSetDefaultStoreAddress(trimmed, applyAddressToCurrentReceipt);
                            showToast(`Alamat Toko Default disimpan: "${trimmed}"`);
                          }
                        }
                      }}
                      placeholder="Contoh: Jl. Raya Ciputat Raya No. 42, Jakarta"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = storeAddressInput.trim();
                      if (!trimmed) {
                        showToast('Alamat toko default tidak boleh kosong.');
                        return;
                      }
                      if (onSetDefaultStoreAddress) {
                        onSetDefaultStoreAddress(trimmed, applyAddressToCurrentReceipt);
                        showToast(`Alamat Toko Default berhasil disimpan: "${trimmed}"`);
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 shrink-0"
                    id="btn-save-default-store-address"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Checkbox: Terapkan juga ke struk aktif */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={applyAddressToCurrentReceipt}
                  onChange={(e) => setApplyAddressToCurrentReceipt(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <span>Terapkan juga langsung ke struk yang sedang dibuat saat ini</span>
              </label>

              {/* Status Note */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    Alamat Toko Aktif: <span className="font-mono text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">{defaultStoreAddress || 'Belum diatur'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Setiap kali Anda menekan tombol <strong>Transaksi Baru</strong> atau memulai struk baru, alamat ini akan langsung terisi secara konsisten.
                  </p>
                </div>
              </div>

              {/* Quick Suggestion Presets */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Preset Cepat Alamat Toko Populer:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Jl. Raya Ciputat Raya No. 42, Jakarta',
                    'Mall Kelapa Gading Lt. 2, Jakarta Utara',
                    'Jl. Malioboro No. 15, Yogyakarta',
                    'Jl. Braga No. 88, Bandung',
                    'Ruko Grand Galaxy City Blok RGB No. 5, Bekasi',
                    'Jl. Pemuda No. 70, Semarang'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setStoreAddressInput(sug);
                        if (onSetDefaultStoreAddress) {
                          onSetDefaultStoreAddress(sug, applyAddressToCurrentReceipt);
                          showToast(`Alamat Toko Default diatur ke: "${sug}"`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                        defaultStoreAddress === sug
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sug}
                      {defaultStoreAddress === sug && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* NAMA KASIR DEFAULT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4" id="section-default-cashier-name">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    Nama Kasir Default
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-sans">
                      Terus Dipakai
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nama kasir utama yang otomatis dicantumkan pada bagian informasi struk baru.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="input-default-cashier-name">
                  Nama Kasir yang Terus Dipakai:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="input-default-cashier-name"
                      value={cashierNameInput}
                      onChange={(e) => setCashierNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = cashierNameInput.trim();
                          if (trimmed && onSetDefaultCashierName) {
                            onSetDefaultCashierName(trimmed, applyCashierToCurrentReceipt);
                            showToast(`Nama Kasir Default disimpan: "${trimmed}"`);
                          }
                        }
                      }}
                      placeholder="Contoh: Andi Wijaya"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = cashierNameInput.trim();
                      if (!trimmed) {
                        showToast('Nama kasir default tidak boleh kosong.');
                        return;
                      }
                      if (onSetDefaultCashierName) {
                        onSetDefaultCashierName(trimmed, applyCashierToCurrentReceipt);
                        showToast(`Nama Kasir Default berhasil disimpan: "${trimmed}"`);
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 shrink-0"
                    id="btn-save-default-cashier-name"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Checkbox: Terapkan juga ke struk aktif */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={applyCashierToCurrentReceipt}
                  onChange={(e) => setApplyCashierToCurrentReceipt(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <span>Terapkan juga langsung ke struk yang sedang dibuat saat ini</span>
              </label>

              {/* Status Note */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    Kasir Aktif: <span className="font-mono text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded">{defaultCashierName || 'Andi Wijaya'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Setiap kali Anda menekan tombol <strong>Transaksi Baru</strong> atau memulai struk baru, nama kasir ini akan langsung digunakan secara konsisten.
                  </p>
                </div>
              </div>

              {/* Quick Suggestion Presets */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Preset Cepat Nama Kasir:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Andi Wijaya',
                    'Siti Nurhaliza',
                    'Budi Santoso',
                    'Rina Kusuma',
                    'Kasir Utama',
                    'Admin Toko'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setCashierNameInput(sug);
                        if (onSetDefaultCashierName) {
                          onSetDefaultCashierName(sug, applyCashierToCurrentReceipt);
                          showToast(`Nama Kasir Default diatur ke: "${sug}"`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                        (defaultCashierName || 'Andi Wijaya') === sug
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sug}
                      {(defaultCashierName || 'Andi Wijaya') === sug && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* NO TELEPON DEFAULT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4" id="section-default-store-phone">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                  <Phone className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    No. Telepon Default
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 font-sans">
                      Terus Dipakai
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nomor telepon atau hotline toko yang otomatis dicantumkan pada bagian header struk baru.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="input-default-store-phone">
                  No. Telepon / Layanan Pelanggan:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      id="input-default-store-phone"
                      value={storePhoneInput}
                      onChange={(e) => setStorePhoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = storePhoneInput.trim();
                          if (trimmed && onSetDefaultStorePhone) {
                            onSetDefaultStorePhone(trimmed, applyPhoneToCurrentReceipt);
                            showToast(`No. Telepon Default disimpan: "${trimmed}"`);
                          }
                        }
                      }}
                      placeholder="Contoh: 021-7401234 atau 0812-3456-7890"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium bg-white text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = storePhoneInput.trim();
                      if (!trimmed) {
                        showToast('No. telepon default tidak boleh kosong.');
                        return;
                      }
                      if (onSetDefaultStorePhone) {
                        onSetDefaultStorePhone(trimmed, applyPhoneToCurrentReceipt);
                        showToast(`No. Telepon Default berhasil disimpan: "${trimmed}"`);
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 shrink-0"
                    id="btn-save-default-store-phone"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>

              {/* Checkbox: Terapkan juga ke struk aktif */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={applyPhoneToCurrentReceipt}
                  onChange={(e) => setApplyPhoneToCurrentReceipt(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <span>Terapkan juga langsung ke struk yang sedang dibuat saat ini</span>
              </label>

              {/* Status Note */}
              <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    Telepon Aktif: <span className="font-mono text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">{defaultStorePhone || '021-7401234'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Setiap kali Anda menekan tombol <strong>Transaksi Baru</strong> atau memulai struk baru, nomor telepon ini akan langsung digunakan secara konsisten.
                  </p>
                </div>
              </div>

              {/* Quick Suggestion Presets */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Preset Cepat Format No. Telepon:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '021-7401234',
                    '0812-3456-7890',
                    '0821-8888-9999',
                    '0857-1234-5678',
                    '022-4201234',
                    '031-5671234'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setStorePhoneInput(sug);
                        if (onSetDefaultStorePhone) {
                          onSetDefaultStorePhone(sug, applyPhoneToCurrentReceipt);
                          showToast(`No. Telepon Default diatur ke: "${sug}"`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition cursor-pointer border ${
                        (defaultStorePhone || '021-7401234') === sug
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sug}
                      {(defaultStorePhone || '021-7401234') === sug && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
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
