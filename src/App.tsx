/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Item } from './types';
import { generateTransactionId, calculateTotals } from './utils';
import ReceiptForm from './components/ReceiptForm';
import ReceiptPreview from './components/ReceiptPreview';
import ReceiptHistory from './components/ReceiptHistory';
import Dashboard from './components/Dashboard';
import { 
  PlusCircle, 
  History, 
  TrendingUp, 
  Calculator, 
  HelpCircle,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Get local date-time string in YYYY-MM-DDTHH:mm format
function getInitialLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localNow = new Date(now.getTime() - (offset * 60 * 1000));
  return localNow.toISOString().slice(0, 16);
}

// Default items to keep the screen populated and beautiful on first view
const DEFAULT_ITEMS: Item[] = [
  { id: '1', name: 'Kopi Susu Gula Aren', quantity: 2, price: 18000 },
  { id: '2', name: 'Roti Bakar Cokelat', quantity: 1, price: 15000 },
];

export default function App() {
  // Global active view tab
  const [activeView, setActiveView] = useState<'generator' | 'history' | 'dashboard'>('generator');
  
  // Currency setting
  const [currencySymbol, setCurrencySymbol] = useState<string>(() => {
    return localStorage.getItem('strukku_currency') || 'Rp';
  });

  // Main history log of saved transactions
  const [history, setHistory] = useState<Receipt[]>(() => {
    const stored = localStorage.getItem('strukku_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any temporary seed transactions if they exist
          return parsed.filter((item: any) => !item.id?.startsWith('seed-tx-'));
        }
      } catch (e) {
        console.error('Error parsing local storage history:', e);
      }
    }
    return [];
  });

  // Active receipt state in the editor
  const [receipt, setReceipt] = useState<Receipt>(() => {
    const initialTxId = generateTransactionId();
    const initialDate = getInitialLocalDateTime();
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals(
      DEFAULT_ITEMS,
      11, // Standard PPN 11%
      0,
      'PERCENT'
    );

    return {
      id: Date.now().toString(),
      storeName: 'KOPI SENJA CIPUTAT',
      storeAddress: 'Jl. Raya Ciputat Raya No. 42, Jakarta',
      storePhone: '021-7401234',
      storeWebsite: 'www.kopisenjaabadi.com',
      cashierName: 'Andi Wijaya',
      transactionId: initialTxId,
      dateTime: initialDate,
      items: DEFAULT_ITEMS,
      taxRate: 11,
      taxAmount,
      discountRate: 0,
      discountType: 'PERCENT',
      discountAmount,
      subtotal,
      total,
      paymentMethod: 'CASH',
      paymentStatus: 'SUDAH_LUNAS',
      cashReceived: 50000,
      changeAmount: 50000 - total,
      notesHeader: 'PT. SENJA ABADI INTERNASIONAL',
      notesFooter: 'TERIMA KASIH ATAS KUNJUNGAN ANDA\nWiFi: senjagratis / pwd: kopi\nLAYANAN PELANGGAN: 0812-XXXX-XXXX',
      fontFamily: 'DEFAULT',
      codeDisplayType: 'BOTH',
      qrValue: 'https://www.kopisenjaabadi.com/struk/verify',
      qrLabel: 'Scan untuk verifikasi struk asli',
      qrSize: 90,
      barcodeValue: '',
      showBarcodeNumber: true,
    };
  });

  // Success notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep currency preference in localStorage
  useEffect(() => {
    localStorage.setItem('strukku_currency', currencySymbol);
  }, [currencySymbol]);

  // Sync history state with localStorage
  useEffect(() => {
    localStorage.setItem('strukku_history', JSON.stringify(history));
  }, [history]);

  // Show a brief visual toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Save the currently generated receipt to local history
  const handleSaveReceipt = () => {
    if (receipt.items.length === 0) return;

    // Check if receipt transactionId is already in history to prevent duplicates, or generate a fresh UUID ID
    const isDuplicate = history.some(item => item.transactionId === receipt.transactionId);
    let finalReceiptToSave = { ...receipt };
    
    if (isDuplicate) {
      // Regenerate ID to treat as separate transaction
      finalReceiptToSave.transactionId = generateTransactionId();
    }
    
    // Assign a unique timestamp ID
    finalReceiptToSave.id = Date.now().toString();

    setHistory((prev) => [finalReceiptToSave, ...prev]);
    showToast(`Struk #${finalReceiptToSave.transactionId.split('/')[0]} berhasil disimpan ke Riwayat!`);
  };

  // Start a fresh, new transaction with an automatically generated unique ID
  const handleNewReceipt = () => {
    const nextTxId = generateTransactionId();
    const formattedNow = getInitialLocalDateTime();
    
    setReceipt((prev) => {
      const { subtotal, taxAmount, discountAmount, total } = calculateTotals(
        [],
        prev.taxRate,
        0,
        'PERCENT'
      );
      
      return {
        ...prev,
        id: Date.now().toString(),
        transactionId: nextTxId,
        dateTime: formattedNow,
        items: [],
        discountRate: 0,
        discountType: 'PERCENT',
        discountAmount,
        subtotal,
        total,
        cashReceived: 0,
        changeAmount: 0,
      };
    });
    
    showToast(`Transaksi Baru Dimulai! ID: ${nextTxId.split('/')[0]}`);
  };

  // Load a historic receipt back into the POS generator for editing/re-printing
  const handleLoadReceipt = (loadedReceipt: Receipt) => {
    setReceipt({
      ...loadedReceipt,
      // Give it a fresh unique timestamp ID but preserve the rest
      id: Date.now().toString(),
    });
    setActiveView('generator');
    showToast(`Struk #${loadedReceipt.transactionId.split('/')[0]} berhasil dimuat ulang ke Generator!`);
    
    // Smooth scroll back to form
    setTimeout(() => {
      document.getElementById('receipt-form-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Delete a specific receipt from history
  const handleDeleteReceipt = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Struk berhasil dihapus dari riwayat.');
  };

  // Clear entire history
  const handleClearHistory = () => {
    setHistory([]);
    showToast('Seluruh riwayat transaksi telah dihapus.');
  };

  // Import JSON backup
  const handleImportHistory = (importedList: Receipt[]) => {
    setHistory(importedList);
    showToast(`${importedList.length} Transaksi berhasil diimpor dari cadangan!`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased flex flex-col">
      
      {/* Visual Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white border border-slate-800 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideIn">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white font-extrabold shadow-sm">
              S
            </div>
            <div>
              <span className="font-extrabold font-display text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                STRUKKU <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">POS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">Generator Struk v2.4</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-100 p-1 rounded-xl gap-0.5">
            <button
              onClick={() => setActiveView('generator')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'generator'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              id="nav-pos-generator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Generator POS</span>
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer relative ${
                activeView === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              id="nav-ledger-history"
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Ledger</span>
              {history.length > 0 && (
                <span className={`absolute -top-1 -right-1 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-extrabold shadow-2xs ${
                  activeView === 'history' ? 'bg-amber-500' : 'bg-slate-900'
                }`}>
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              id="nav-sales-analytics"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Statistik</span>
            </button>
          </nav>

          {/* Currency Shortcut preference */}
          <div className="hidden sm:flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50/50 text-slate-700">
            <span>Mata Uang:</span>
            <span className="text-slate-900 font-mono">{currencySymbol}</span>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW 1: MAIN RECEIPT GENERATOR */}
        {activeView === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side input form (Col span 7) */}
            <div className="lg:col-span-7 h-full">
              <ReceiptForm
                receipt={receipt}
                onUpdateReceipt={setReceipt}
                onSaveReceipt={handleSaveReceipt}
                onNewReceipt={handleNewReceipt}
                currencySymbol={currencySymbol}
                setCurrencySymbol={setCurrencySymbol}
              />
            </div>

            {/* Right side live thermal preview (Col span 5) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <ReceiptPreview
                receipt={receipt}
                currencySymbol={currencySymbol}
                onUpdateReceipt={(updated) => setReceipt((prev) => ({ ...prev, ...updated }))}
              />
            </div>

          </div>
        )}

        {/* VIEW 2: SAVED LEDGER HISTORY */}
        {activeView === 'history' && (
          <div className="h-full">
            <ReceiptHistory
              history={history}
              onLoadReceipt={handleLoadReceipt}
              onDeleteReceipt={handleDeleteReceipt}
              onClearHistory={handleClearHistory}
              onImportHistory={handleImportHistory}
              currencySymbol={currencySymbol}
            />
          </div>
        )}

        {/* VIEW 3: SALES TRENDS & PRODUCT ANALYSIS DASHBOARD */}
        {activeView === 'dashboard' && (
          <div className="h-full">
            <Dashboard
              history={history}
              currencySymbol={currencySymbol}
            />
          </div>
        )}

      </main>

      {/* Human, Humble Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 STRUKKU. Alat cetak struk minimarket, simulator POS kasir, dan ekspor laporan transaksi.</p>
        </div>
      </footer>
    </div>
  );
}
