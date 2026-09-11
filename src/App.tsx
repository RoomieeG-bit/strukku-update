/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt, Item } from './types';
import { generateTransactionId, calculateTotals, loadCustomFontsFromStorage, registerCustomFontsInDocument } from './utils';
import ReceiptForm from './components/ReceiptForm';
import ReceiptPreview from './components/ReceiptPreview';
import ReceiptHistory from './components/ReceiptHistory';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { 
  PlusCircle, 
  History, 
  TrendingUp, 
  Calculator, 
  HelpCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon
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

function getFreshDefaultReceipt(
  customStoreName?: string, 
  customStoreAddress?: string,
  customCashierName?: string,
  customStorePhone?: string
): Receipt {
  const initialTxId = generateTransactionId();
  const initialDate = getInitialLocalDateTime();
  const defaultStore = customStoreName || (typeof localStorage !== 'undefined' ? localStorage.getItem('strukku_default_store_name') : null) || 'KOPI SENJA CIPUTAT';
  const defaultAddress = customStoreAddress || (typeof localStorage !== 'undefined' ? localStorage.getItem('strukku_default_store_address') : null) || 'Jl. Raya Ciputat Raya No. 42, Jakarta';
  const defaultCashier = customCashierName || (typeof localStorage !== 'undefined' ? localStorage.getItem('strukku_default_cashier_name') : null) || 'Andi Wijaya';
  const defaultPhone = customStorePhone || (typeof localStorage !== 'undefined' ? localStorage.getItem('strukku_default_store_phone') : null) || '021-7401234';
  const { subtotal, taxAmount, discountAmount, total } = calculateTotals(
    DEFAULT_ITEMS,
    11, // Standard PPN 11%
    0,
    'PERCENT'
  );

  return {
    id: Date.now().toString(),
    storeName: defaultStore,
    storeAddress: defaultAddress,
    storePhone: defaultPhone,
    storeWebsite: 'www.kopisenjaabadi.com',
    cashierName: defaultCashier,
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
    cashReceived: total,
    changeAmount: 0,
    notesHeader: 'PT. SENJA ABADI INTERNASIONAL',
    notesFooter: 'TERIMA KASIH ATAS KUNJUNGAN ANDA\nWiFi: senjagratis / pwd: kopi\nLAYANAN PELANGGAN: 0812-XXXX-XXXX',
    fontFamily: 'DEFAULT',
    paperWidthMm: 80,
    paperSizePreset: '80mm',
    codeDisplayType: 'BOTH',
    qrValue: 'https://www.kopisenjaabadi.com/struk/verify',
    qrLabel: 'Scan untuk verifikasi struk asli',
    qrSize: 90,
    barcodeValue: '',
    showBarcodeNumber: true,
    isDraft: true,
    draftSavedAt: new Date().toISOString(),
  };
}

export default function App() {
  // Global active view tab
  const [activeView, setActiveView] = useState<'generator' | 'history' | 'dashboard' | 'settings'>('generator');
  
  // Currency setting
  const [currencySymbol, setCurrencySymbol] = useState<string>(() => {
    return localStorage.getItem('strukku_currency') || 'Rp';
  });

  // Default Store Name setting (persisted in localStorage)
  const [defaultStoreName, setDefaultStoreName] = useState<string>(() => {
    return localStorage.getItem('strukku_default_store_name') || 'KOPI SENJA CIPUTAT';
  });

  // Default Store Address setting (persisted in localStorage)
  const [defaultStoreAddress, setDefaultStoreAddress] = useState<string>(() => {
    return localStorage.getItem('strukku_default_store_address') || 'Jl. Raya Ciputat Raya No. 42, Jakarta';
  });

  // Default Cashier Name setting (persisted in localStorage)
  const [defaultCashierName, setDefaultCashierName] = useState<string>(() => {
    return localStorage.getItem('strukku_default_cashier_name') || 'Andi Wijaya';
  });

  // Default Store Phone setting (persisted in localStorage)
  const [defaultStorePhone, setDefaultStorePhone] = useState<string>(() => {
    return localStorage.getItem('strukku_default_store_phone') || '021-7401234';
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

  // Trash history log of deleted transactions (can be restored)
  const [trashHistory, setTrashHistory] = useState<Receipt[]>(() => {
    const stored = localStorage.getItem('strukku_trash_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing local storage trash history:', e);
      }
    }
    return [];
  });

  // Archived receipts log (receipts stored away for clean ledger & record-keeping)
  const [archivedHistory, setArchivedHistory] = useState<Receipt[]>(() => {
    const stored = localStorage.getItem('strukku_archived_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing local storage archived history:', e);
      }
    }
    return [];
  });

  // Active receipt state in the editor with autosave draft recovery
  const [receipt, setReceipt] = useState<Receipt>(() => {
    const savedDefaultStore = localStorage.getItem('strukku_default_store_name') || 'KOPI SENJA CIPUTAT';
    const savedDefaultAddress = localStorage.getItem('strukku_default_store_address') || 'Jl. Raya Ciputat Raya No. 42, Jakarta';
    const savedDefaultCashier = localStorage.getItem('strukku_default_cashier_name') || 'Andi Wijaya';
    const savedDefaultPhone = localStorage.getItem('strukku_default_store_phone') || '021-7401234';
    try {
      const activeDraftRaw = localStorage.getItem('strukku_active_draft');
      if (activeDraftRaw) {
        const parsedDraft = JSON.parse(activeDraftRaw);
        if (parsedDraft && parsedDraft.transactionId && Array.isArray(parsedDraft.items)) {
          return parsedDraft;
        }
      }
    } catch (e) {
      console.error('Error restoring active draft on init:', e);
    }
    return getFreshDefaultReceipt(savedDefaultStore, savedDefaultAddress, savedDefaultCashier, savedDefaultPhone);
  });

  // Track last autosave timestamp
  const [lastAutosavedAt, setLastAutosavedAt] = useState<Date | null>(null);

  // Keep a stable ref to receipt for intervals and window beforeunload listeners
  const receiptRef = React.useRef(receipt);
  useEffect(() => {
    receiptRef.current = receipt;
  }, [receipt]);

  // Success notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Register imported custom TTF/OTF fonts on initial mount
  useEffect(() => {
    const fonts = loadCustomFontsFromStorage();
    registerCustomFontsInDocument(fonts);
  }, []);

  // Keep currency preference in localStorage
  useEffect(() => {
    localStorage.setItem('strukku_currency', currencySymbol);
  }, [currencySymbol]);

  // Keep default store name preference in localStorage
  useEffect(() => {
    localStorage.setItem('strukku_default_store_name', defaultStoreName);
  }, [defaultStoreName]);

  // Keep default store address preference in localStorage
  useEffect(() => {
    localStorage.setItem('strukku_default_store_address', defaultStoreAddress);
  }, [defaultStoreAddress]);

  // Keep default cashier name preference in localStorage
  useEffect(() => {
    localStorage.setItem('strukku_default_cashier_name', defaultCashierName);
  }, [defaultCashierName]);

  // Keep default store phone preference in localStorage
  useEffect(() => {
    localStorage.setItem('strukku_default_store_phone', defaultStorePhone);
  }, [defaultStorePhone]);

  // Sync history state with localStorage
  useEffect(() => {
    localStorage.setItem('strukku_history', JSON.stringify(history));
  }, [history]);

  // Sync trashHistory state with localStorage
  useEffect(() => {
    localStorage.setItem('strukku_trash_history', JSON.stringify(trashHistory));
  }, [trashHistory]);

  // Sync archivedHistory state with localStorage
  useEffect(() => {
    localStorage.setItem('strukku_archived_history', JSON.stringify(archivedHistory));
  }, [archivedHistory]);

  // 1. Continuous reactive autosave on every receipt change:
  // Whenever the user types, adds an item, changes price, cashier, or store name on mobile or desktop,
  // it is IMMEDIATELY persisted to localStorage. This guarantees zero data loss on mobile devices
  // even if the user locks the screen, switches apps, or refreshes before any timer fires.
  useEffect(() => {
    if (!receipt) return;
    try {
      localStorage.setItem('strukku_active_draft', JSON.stringify(receipt));
      setLastAutosavedAt(new Date());
    } catch (err) {
      console.error('Reactive autosave error:', err);
    }
  }, [receipt]);

  // 2. Periodic heartbeat autosave (every 2 seconds) to keep timestamp updated and guarantee sync
  useEffect(() => {
    const timer = setInterval(() => {
      const current = receiptRef.current;
      if (current) {
        try {
          localStorage.setItem('strukku_active_draft', JSON.stringify(current));
          setLastAutosavedAt(new Date());
        } catch (err) {
          console.error('Autosave interval error:', err);
        }
      }
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // 3. Mobile Lifecycle & Exit handler:
  // Saves current unfinalized receipt to history ledger as a draft when:
  // - User switches apps or minimizes browser on mobile (visibilitychange 'hidden')
  // - User closes tab or navigates away (pagehide, beforeunload)
  // - Mobile browser freezes the tab to save memory (freeze)
  useEffect(() => {
    const saveActiveDraftToLedger = () => {
      const current = receiptRef.current;
      if (!current) return;
      // Skip saving empty receipts with 0 items
      if (!current.items || current.items.length === 0) return;

      try {
        // Ensure active draft in localStorage is up to date
        localStorage.setItem('strukku_active_draft', JSON.stringify(current));

        const rawHistory = localStorage.getItem('strukku_history');
        let currentHistory: Receipt[] = [];
        if (rawHistory) {
          try {
            const parsed = JSON.parse(rawHistory);
            if (Array.isArray(parsed)) currentHistory = parsed;
          } catch {
            currentHistory = [];
          }
        }

        const existingIdx = currentHistory.findIndex(
          (item) => item.id === current.id || item.transactionId === current.transactionId
        );

        // CRITICAL PROTECTION: If this receipt is already finalized in history (!isDraft),
        // NEVER convert or overwrite it as a draft!
        if (existingIdx >= 0 && !currentHistory[existingIdx].isDraft) {
          return;
        }

        const draftToPersist: Receipt = {
          ...current,
          isDraft: true,
          draftSavedAt: current.draftSavedAt || new Date().toISOString(),
        };

        let updatedHistory: Receipt[];
        if (existingIdx >= 0) {
          updatedHistory = currentHistory.map((item, idx) => (idx === existingIdx ? draftToPersist : item));
        } else {
          updatedHistory = [draftToPersist, ...currentHistory];
        }

        localStorage.setItem('strukku_history', JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
      } catch (err) {
        console.error('Error auto-saving draft on browser/mobile close:', err);
      }
    };

    window.addEventListener('beforeunload', saveActiveDraftToLedger);
    window.addEventListener('pagehide', saveActiveDraftToLedger);
    window.addEventListener('freeze', saveActiveDraftToLedger);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveActiveDraftToLedger();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', saveActiveDraftToLedger);
      window.removeEventListener('pagehide', saveActiveDraftToLedger);
      window.removeEventListener('freeze', saveActiveDraftToLedger);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update default store name setting and optionally update active receipt
  const handleSetDefaultStoreName = (newStoreName: string, applyToCurrent: boolean = true) => {
    const trimmed = newStoreName.trim();
    if (!trimmed) return;
    setDefaultStoreName(trimmed);
    localStorage.setItem('strukku_default_store_name', trimmed);
    if (applyToCurrent) {
      setReceipt((prev) => ({
        ...prev,
        storeName: trimmed,
      }));
    }
  };

  // Update default store address setting and optionally update active receipt
  const handleSetDefaultStoreAddress = (newStoreAddress: string, applyToCurrent: boolean = true) => {
    const trimmed = newStoreAddress.trim();
    if (!trimmed) return;
    setDefaultStoreAddress(trimmed);
    localStorage.setItem('strukku_default_store_address', trimmed);
    if (applyToCurrent) {
      setReceipt((prev) => ({
        ...prev,
        storeAddress: trimmed,
      }));
    }
  };

  // Update default cashier name setting and optionally update active receipt
  const handleSetDefaultCashierName = (newCashierName: string, applyToCurrent: boolean = true) => {
    const trimmed = newCashierName.trim();
    if (!trimmed) return;
    setDefaultCashierName(trimmed);
    localStorage.setItem('strukku_default_cashier_name', trimmed);
    if (applyToCurrent) {
      setReceipt((prev) => ({
        ...prev,
        cashierName: trimmed,
      }));
    }
  };

  // Update default store phone setting and optionally update active receipt
  const handleSetDefaultStorePhone = (newPhone: string, applyToCurrent: boolean = true) => {
    const trimmed = newPhone.trim();
    if (!trimmed) return;
    setDefaultStorePhone(trimmed);
    localStorage.setItem('strukku_default_store_phone', trimmed);
    if (applyToCurrent) {
      setReceipt((prev) => ({
        ...prev,
        storePhone: trimmed,
      }));
    }
  };

  // Show a brief visual toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Save the currently generated receipt to local history (finalizing and immediately moving to Semua Riwayat)
  const handleSaveReceipt = () => {
    if (receipt.items.length === 0) return;

    const finalReceiptToSave: Receipt = {
      ...receipt,
      isDraft: false,
      draftSavedAt: undefined,
    };

    // Update active receipt state and ref to finalized immediately
    setReceipt(finalReceiptToSave);
    receiptRef.current = finalReceiptToSave;

    // Clear active draft in localStorage once finalized
    localStorage.removeItem('strukku_active_draft');

    // Update history state and localStorage
    setHistory((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.id === finalReceiptToSave.id || item.transactionId === finalReceiptToSave.transactionId
      );

      let updated: Receipt[];
      if (existingIdx >= 0) {
        updated = prev.map((item, idx) => (idx === existingIdx ? finalReceiptToSave : item));
      } else {
        updated = [finalReceiptToSave, ...prev];
      }
      try {
        localStorage.setItem('strukku_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving history to localStorage:', err);
      }
      return updated;
    });

    // Prepare a clean fresh receipt in generator for the next customer
    const nextFreshReceipt = getFreshDefaultReceipt(
      defaultStoreName, 
      defaultStoreAddress, 
      defaultCashierName, 
      defaultStorePhone
    );
    setReceipt(nextFreshReceipt);
    receiptRef.current = nextFreshReceipt;
    try {
      localStorage.setItem('strukku_active_draft', JSON.stringify(nextFreshReceipt));
    } catch (err) {
      console.error('Error saving fresh draft to storage:', err);
    }

    showToast(`✅ Struk #${finalReceiptToSave.transactionId.split('/')[0]} berhasil difinalisasi dan langsung masuk ke Semua Riwayat!`);

    // Immediately switch to the history view so user sees it in "Semua Riwayat" right away
    setActiveView('history');
  };

  // Start a fresh, new transaction with an automatically generated unique ID, default store name & default address
  const handleNewReceipt = () => {
    const nextTxId = generateTransactionId();
    const formattedNow = getInitialLocalDateTime();
    const effectiveStore = defaultStoreName || 'KOPI SENJA CIPUTAT';
    const effectiveAddress = defaultStoreAddress || 'Jl. Raya Ciputat Raya No. 42, Jakarta';
    const effectiveCashier = defaultCashierName || 'Andi Wijaya';
    const effectivePhone = defaultStorePhone || '021-7401234';
    
    setReceipt((prev) => {
      const { subtotal, taxAmount, discountAmount, total } = calculateTotals(
        [],
        prev.taxRate,
        0,
        'PERCENT'
      );
      
      const newReceipt: Receipt = {
        ...prev,
        id: Date.now().toString(),
        storeName: effectiveStore,
        storeAddress: effectiveAddress,
        cashierName: effectiveCashier,
        storePhone: effectivePhone,
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
        isDraft: true,
        draftSavedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem('strukku_active_draft', JSON.stringify(newReceipt));
      } catch (e) {
        console.error('Error saving new draft:', e);
      }
      
      return newReceipt;
    });
    
    showToast(`Transaksi Baru Dimulai! ID: ${nextTxId.split('/')[0]}`);
  };

  // Load a historic receipt or draft back into the POS generator for editing/re-printing
  const handleLoadReceipt = (loadedReceipt: Receipt) => {
    setReceipt({
      ...loadedReceipt,
      id: loadedReceipt.id || Date.now().toString(),
    });
    localStorage.setItem('strukku_active_draft', JSON.stringify(loadedReceipt));
    setActiveView('generator');
    if (loadedReceipt.isDraft) {
      showToast(`📝 Draf struk #${loadedReceipt.transactionId.split('/')[0]} dibuka di Generator! Lanjutkan transaksi.`);
    } else {
      showToast(`Struk #${loadedReceipt.transactionId.split('/')[0]} berhasil dimuat ulang ke Generator!`);
    }
    
    // Smooth scroll back to form
    setTimeout(() => {
      document.getElementById('receipt-form-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Update an existing receipt in history or archived history directly
  const handleUpdateReceipt = (updatedReceipt: Receipt) => {
    const inHistory = history.some((item) => item.id === updatedReceipt.id);
    if (inHistory) {
      setHistory((prev) =>
        prev.map((item) => (item.id === updatedReceipt.id ? updatedReceipt : item))
      );
      showToast(`✏️ Struk #${updatedReceipt.transactionId.split('/')[0]} berhasil diperbarui di Riwayat!`);
      return;
    }

    const inArchived = archivedHistory.some((item) => item.id === updatedReceipt.id);
    if (inArchived) {
      setArchivedHistory((prev) =>
        prev.map((item) => (item.id === updatedReceipt.id ? updatedReceipt : item))
      );
      showToast(`✏️ Struk arsip #${updatedReceipt.transactionId.split('/')[0]} berhasil diperbarui!`);
      return;
    }

    setHistory((prev) => [updatedReceipt, ...prev.filter((item) => item.id !== updatedReceipt.id)]);
    showToast(`✏️ Struk #${updatedReceipt.transactionId.split('/')[0]} berhasil diperbarui!`);
  };

  // Finalize a draft receipt directly into active history ledger (Semua Riwayat)
  const handleFinalizeReceipt = (id: string) => {
    let finalizedItemName = '';
    setHistory((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;
      finalizedItemName = target.transactionId.split('/')[0];
      const finalizedItem: Receipt = {
        ...target,
        isDraft: false,
        draftSavedAt: undefined,
      };

      // If active receipt in generator matches this draft, update it too
      if (receiptRef.current?.id === id || receiptRef.current?.transactionId === target.transactionId) {
        setReceipt(finalizedItem);
        receiptRef.current = finalizedItem;
        localStorage.removeItem('strukku_active_draft');
      }

      const updated = prev.map((item) => (item.id === id ? finalizedItem : item));
      try {
        localStorage.setItem('strukku_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving history after finalizing draft:', err);
      }
      return updated;
    });

    showToast(`✅ Draf #${finalizedItemName} berhasil difinalisasi dan langsung masuk ke Semua Riwayat!`);
  };

  // Finalize ALL draft receipts at once into active history ledger
  const handleFinalizeAllDrafts = () => {
    const draftCount = history.filter((item) => item.isDraft).length;
    if (draftCount === 0) return;

    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.isDraft
          ? { ...item, isDraft: false, draftSavedAt: undefined }
          : item
      );
      try {
        localStorage.setItem('strukku_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving history after finalizing all drafts:', err);
      }
      return updated;
    });

    if (receiptRef.current?.isDraft) {
      const finalizedCurrent = { ...receiptRef.current, isDraft: false, draftSavedAt: undefined };
      setReceipt(finalizedCurrent);
      receiptRef.current = finalizedCurrent;
      localStorage.removeItem('strukku_active_draft');
    }

    showToast(`✅ ${draftCount} draf transaksi berhasil difinalisasi dan langsung masuk ke Semua Riwayat!`);
  };

  // Toggle Pin / Favorite state for a receipt in history
  const handleTogglePinReceipt = (id: string) => {
    setHistory((prev) => {
      const target = prev.find((item) => item.id === id);
      const nextPinned = !(target?.isPinned || target?.isFavorite);
      const updated = prev.map((item) => 
        item.id === id ? { ...item, isPinned: nextPinned, isFavorite: nextPinned } : item
      );
      showToast(nextPinned ? '📌 Struk berhasil di-pin ke paling atas riwayat!' : 'Struk dilepas dari pin riwayat.');
      return updated;
    });
  };

  // Delete a specific receipt from history (moves to Trash so it can be restored)
  const handleDeleteReceipt = (id: string) => {
    const itemToDelete = history.find((item) => item.id === id);
    if (!itemToDelete) return;

    const markedItem: Receipt = {
      ...itemToDelete,
      deletedAt: new Date().toISOString(),
    };

    setHistory((prev) => prev.filter((item) => item.id !== id));
    setTrashHistory((prev) => [markedItem, ...prev.filter((item) => item.id !== id)]);
    showToast(`🗑️ Struk #${itemToDelete.transactionId.split('/')[0]} dipindahkan ke Sampah.`);
  };

  // Clear all drafts from history (moves to Trash)
  const handleClearDrafts = () => {
    const drafts = history.filter((item) => item.isDraft);
    if (drafts.length === 0) return;
    const now = new Date().toISOString();
    const markedDrafts: Receipt[] = drafts.map((item) => ({
      ...item,
      deletedAt: item.deletedAt || now,
    }));

    setTrashHistory((prev) => [...markedDrafts, ...prev]);
    setHistory((prev) => prev.filter((item) => !item.isDraft));
    localStorage.removeItem('strukku_active_draft');
    showToast(`🗑️ ${drafts.length} draf struk dipindahkan ke Sampah.`);
  };

  // Bulk Archive receipts from active history
  const handleBulkArchiveReceipts = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const itemsToArchive = history.filter((item) => idSet.has(item.id));
    if (itemsToArchive.length === 0) return;
    const now = new Date().toISOString();
    const archivedItems: Receipt[] = itemsToArchive.map((item) => ({
      ...item,
      isArchived: true,
      archivedAt: item.archivedAt || now,
    }));

    setHistory((prev) => prev.filter((item) => !idSet.has(item.id)));
    setArchivedHistory((prev) => [...archivedItems, ...prev.filter((item) => !idSet.has(item.id))]);
    showToast(`📦 ${itemsToArchive.length} struk berhasil diarsipkan!`);
  };

  // Bulk Delete receipts to trash
  const handleBulkDeleteReceipts = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const itemsToDelete = history.filter((item) => idSet.has(item.id));
    if (itemsToDelete.length === 0) return;
    const now = new Date().toISOString();
    const markedItems: Receipt[] = itemsToDelete.map((item) => ({
      ...item,
      deletedAt: item.deletedAt || now,
    }));

    setHistory((prev) => prev.filter((item) => !idSet.has(item.id)));
    setTrashHistory((prev) => [...markedItems, ...prev.filter((item) => !idSet.has(item.id))]);
    showToast(`🗑️ ${itemsToDelete.length} struk dipindahkan ke Sampah.`);
  };

  // Bulk Finalize Drafts: convert selected drafts into finalized transactions
  const handleBulkFinalizeDrafts = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setHistory((prev) => {
      const updated = prev.map((item) => {
        if (idSet.has(item.id) && item.isDraft) {
          return {
            ...item,
            isDraft: false,
            draftSavedAt: undefined,
          };
        }
        return item;
      });
      return updated;
    });

    if (receiptRef.current?.id && idSet.has(receiptRef.current.id)) {
      setReceipt((prev) => ({
        ...prev,
        isDraft: false,
        draftSavedAt: undefined,
      }));
      localStorage.removeItem('strukku_active_draft');
    }

    showToast(`✅ ${ids.length} draf struk berhasil difinalisasi ke Semua Riwayat!`);
  };

  // Bulk Unarchive Receipts back to active history
  const handleBulkUnarchiveReceipts = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const itemsToRestore = archivedHistory.filter((item) => idSet.has(item.id));
    if (itemsToRestore.length === 0) return;

    const restoredItems: Receipt[] = itemsToRestore.map((item) => ({
      ...item,
      isArchived: false,
      archivedAt: undefined,
    }));

    setArchivedHistory((prev) => prev.filter((item) => !idSet.has(item.id)));
    setHistory((prev) => [...restoredItems, ...prev.filter((item) => !idSet.has(item.id))]);
    showToast(`📂 ${itemsToRestore.length} struk arsip berhasil dikembalikan ke Riwayat Aktif!`);
  };

  // Bulk Delete from Archived History into Trash
  const handleBulkDeleteArchivedReceipts = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const itemsToDelete = archivedHistory.filter((item) => idSet.has(item.id));
    if (itemsToDelete.length === 0) return;
    const now = new Date().toISOString();
    const markedItems: Receipt[] = itemsToDelete.map((item) => ({
      ...item,
      deletedAt: item.deletedAt || now,
    }));

    setArchivedHistory((prev) => prev.filter((item) => !idSet.has(item.id)));
    setTrashHistory((prev) => [...markedItems, ...prev.filter((item) => !idSet.has(item.id))]);
    showToast(`🗑️ ${itemsToDelete.length} struk arsip dipindahkan ke Sampah.`);
  };

  // Bulk Restore from Trash back to active history
  const handleBulkRestoreTrash = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const itemsToRestore = trashHistory.filter((item) => idSet.has(item.id));
    if (itemsToRestore.length === 0) return;

    const restoredItems: Receipt[] = itemsToRestore.map((item) => ({
      ...item,
      deletedAt: undefined,
    }));

    setTrashHistory((prev) => prev.filter((item) => !idSet.has(item.id)));
    setHistory((prev) => [...restoredItems, ...prev.filter((item) => !idSet.has(item.id))]);
    showToast(`♻️ ${itemsToRestore.length} struk sampah berhasil dipulihkan ke Riwayat!`);
  };

  // Bulk Permanently Delete receipts from Trash
  const handleBulkPermanentDeleteTrash = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setTrashHistory((prev) => prev.filter((item) => !idSet.has(item.id)));
    showToast(`🗑️ ${ids.length} struk dihapus permanen dari Kotak Sampah.`);
  };

  // Clear entire history (moves all active receipts to Trash)
  const handleClearHistory = () => {
    if (history.length === 0) return;
    const now = new Date().toISOString();
    const markedItems: Receipt[] = history.map((item) => ({
      ...item,
      deletedAt: item.deletedAt || now,
    }));

    setTrashHistory((prev) => [...markedItems, ...prev]);
    setHistory([]);
    showToast(`${markedItems.length} transaksi dipindahkan ke Sampah.`);
  };

  // Restore a single receipt from trash back to active history
  const handleRestoreReceipt = (id: string) => {
    const itemToRestore = trashHistory.find((item) => item.id === id);
    if (!itemToRestore) return;

    const restoredItem: Receipt = {
      ...itemToRestore,
      deletedAt: undefined,
    };

    setTrashHistory((prev) => prev.filter((item) => item.id !== id));
    setHistory((prev) => [restoredItem, ...prev.filter((item) => item.id !== id)]);
    showToast(`♻️ Struk #${itemToRestore.transactionId.split('/')[0]} berhasil dipulihkan ke Riwayat!`);
  };

  // Restore all receipts from trash back to active history
  const handleRestoreAllTrash = () => {
    if (trashHistory.length === 0) return;
    const count = trashHistory.length;
    const restoredItems: Receipt[] = trashHistory.map((item) => ({
      ...item,
      deletedAt: undefined,
    }));

    const restoredIds = new Set(restoredItems.map((item) => item.id));
    setHistory((prev) => [...restoredItems, ...prev.filter((item) => !restoredIds.has(item.id))]);
    setTrashHistory([]);
    showToast(`♻️ ${count} struk berhasil dipulihkan ke Riwayat!`);
  };

  // Permanently delete a single receipt from trash
  const handlePermanentDeleteReceipt = (id: string) => {
    setTrashHistory((prev) => prev.filter((item) => item.id !== id));
    showToast('Struk dihapus permanen dari Sampah.');
  };

  // Empty all items from trash
  const handleEmptyTrash = () => {
    setTrashHistory([]);
    showToast('Kotak Sampah berhasil dikosongkan.');
  };

  // Archive a specific receipt from active history
  const handleArchiveReceipt = (id: string) => {
    const itemToArchive = history.find((item) => item.id === id);
    if (!itemToArchive) return;

    const archivedItem: Receipt = {
      ...itemToArchive,
      isArchived: true,
      archivedAt: new Date().toISOString(),
    };

    setHistory((prev) => prev.filter((item) => item.id !== id));
    setArchivedHistory((prev) => [archivedItem, ...prev.filter((item) => item.id !== id)]);
    showToast(`📦 Struk #${itemToArchive.transactionId.split('/')[0]} berhasil diarsipkan!`);
  };

  // Archive all active receipts
  const handleArchiveAllHistory = () => {
    if (history.length === 0) return;
    const now = new Date().toISOString();
    const count = history.length;
    const archivedItems: Receipt[] = history.map((item) => ({
      ...item,
      isArchived: true,
      archivedAt: item.archivedAt || now,
    }));

    const archivedIds = new Set(archivedItems.map((item) => item.id));
    setArchivedHistory((prev) => [...archivedItems, ...prev.filter((item) => !archivedIds.has(item.id))]);
    setHistory([]);
    showToast(`📦 ${count} transaksi berhasil dipindahkan ke Struk Yang Di Arsipkan!`);
  };

  // Restore/unarchive a specific receipt back to active history
  const handleUnarchiveReceipt = (id: string) => {
    const itemToRestore = archivedHistory.find((item) => item.id === id);
    if (!itemToRestore) return;

    const restoredItem: Receipt = {
      ...itemToRestore,
      isArchived: false,
      archivedAt: undefined,
    };

    setArchivedHistory((prev) => prev.filter((item) => item.id !== id));
    setHistory((prev) => [restoredItem, ...prev.filter((item) => item.id !== id)]);
    showToast(`📂 Struk #${itemToRestore.transactionId.split('/')[0]} dikembalikan ke Riwayat Aktif!`);
  };

  // Unarchive all archived receipts back to active history
  const handleUnarchiveAll = () => {
    if (archivedHistory.length === 0) return;
    const count = archivedHistory.length;
    const restoredItems: Receipt[] = archivedHistory.map((item) => ({
      ...item,
      isArchived: false,
      archivedAt: undefined,
    }));

    const restoredIds = new Set(restoredItems.map((item) => item.id));
    setHistory((prev) => [...restoredItems, ...prev.filter((item) => !restoredIds.has(item.id))]);
    setArchivedHistory([]);
    showToast(`📂 ${count} struk arsip berhasil dikembalikan ke Riwayat Aktif!`);
  };

  // Move an archived receipt to trash
  const handleDeleteArchivedReceipt = (id: string) => {
    const itemToDelete = archivedHistory.find((item) => item.id === id);
    if (!itemToDelete) return;

    const markedItem: Receipt = {
      ...itemToDelete,
      deletedAt: new Date().toISOString(),
    };

    setArchivedHistory((prev) => prev.filter((item) => item.id !== id));
    setTrashHistory((prev) => [markedItem, ...prev.filter((item) => item.id !== id)]);
    showToast(`🗑️ Struk arsip #${itemToDelete.transactionId.split('/')[0]} dipindahkan ke Sampah.`);
  };

  // Move all archived receipts to trash
  const handleClearArchivedHistory = () => {
    if (archivedHistory.length === 0) return;
    const now = new Date().toISOString();
    const count = archivedHistory.length;
    const markedItems: Receipt[] = archivedHistory.map((item) => ({
      ...item,
      deletedAt: item.deletedAt || now,
    }));

    setTrashHistory((prev) => [...markedItems, ...prev]);
    setArchivedHistory([]);
    showToast(`${count} struk arsip dipindahkan ke Sampah.`);
  };

  // Import JSON backup (legacy history only)
  const handleImportHistory = (importedList: Receipt[]) => {
    setHistory(importedList);
    showToast(`${importedList.length} Transaksi berhasil diimpor dari cadangan!`);
  };

  // Reset all data from localStorage (Factory Reset)
  const handleResetAllData = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    setHistory([]);
    setArchivedHistory([]);
    setTrashHistory([]);
    setCurrencySymbol('Rp');
    setDefaultStoreName('KOPI SENJA CIPUTAT');
    setDefaultStoreAddress('Jl. Raya Ciputat Raya No. 42, Jakarta');
    setDefaultCashierName('Andi Wijaya');
    setDefaultStorePhone('021-7401234');
    setReceipt(getFreshDefaultReceipt('KOPI SENJA CIPUTAT', 'Jl. Raya Ciputat Raya No. 42, Jakarta', 'Andi Wijaya', '021-7401234'));
    showToast('⚠️ Seluruh data LocalStorage berhasil dibersihkan ke bawaan pabrik.');
  };

  // Full backup restore (including pinned receipts, custom presets, currency, default store name, active draft)
  const handleRestoreBackup = (backupData: {
    history?: Receipt[];
    archivedHistory?: Receipt[];
    customPresets?: any[];
    currencySymbol?: string;
    defaultStoreName?: string;
    defaultStoreAddress?: string;
    defaultCashierName?: string;
    defaultStorePhone?: string;
    activeReceipt?: Receipt;
  }) => {
    if (Array.isArray(backupData.history)) {
      setHistory(backupData.history);
      localStorage.setItem('strukku_history', JSON.stringify(backupData.history));
    }
    if (Array.isArray(backupData.archivedHistory)) {
      setArchivedHistory(backupData.archivedHistory);
      localStorage.setItem('strukku_archived_history', JSON.stringify(backupData.archivedHistory));
    }
    if (Array.isArray(backupData.customPresets)) {
      localStorage.setItem('strukku_custom_presets', JSON.stringify(backupData.customPresets));
    }
    if (backupData.currencySymbol) {
      setCurrencySymbol(backupData.currencySymbol);
      localStorage.setItem('strukku_currency', backupData.currencySymbol);
    }
    if (backupData.defaultStoreName) {
      setDefaultStoreName(backupData.defaultStoreName);
      localStorage.setItem('strukku_default_store_name', backupData.defaultStoreName);
    }
    if (backupData.defaultStoreAddress) {
      setDefaultStoreAddress(backupData.defaultStoreAddress);
      localStorage.setItem('strukku_default_store_address', backupData.defaultStoreAddress);
    }
    if (backupData.defaultCashierName) {
      setDefaultCashierName(backupData.defaultCashierName);
      localStorage.setItem('strukku_default_cashier_name', backupData.defaultCashierName);
    }
    if (backupData.defaultStorePhone) {
      setDefaultStorePhone(backupData.defaultStorePhone);
      localStorage.setItem('strukku_default_store_phone', backupData.defaultStorePhone);
    }
    if (backupData.activeReceipt && typeof backupData.activeReceipt === 'object') {
      setReceipt(backupData.activeReceipt);
    }
    showToast('🎉 Seluruh data cadangan lengkap berhasil dipulihkan!');
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans antialiased flex flex-col selection:bg-slate-900 selection:text-white">
      
      {/* Visual Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 backdrop-blur-md bg-slate-950/95 text-white border border-slate-800/90 px-4 py-3 rounded-2xl shadow-2xl shadow-slate-950/20 flex items-center gap-2.5 text-xs font-semibold animate-slideIn">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="tracking-tight text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shrink-0 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-white flex items-center justify-center font-extrabold text-sm shadow-xs ring-1 ring-black/5">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold font-display text-[15px] tracking-tight text-slate-950">
                  STRUKKU
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md leading-none">
                  POS PRO
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block leading-none mt-0.5">Generator Struk Kasir</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex bg-slate-100/90 border border-slate-200/60 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveView('generator')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'generator'
                  ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              id="nav-pos-generator"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Generator POS</span>
            </button>
            <button
              onClick={() => {
                // Safely save current unfinalized receipt with items as draft
                if (receipt.items && receipt.items.length > 0) {
                  setHistory((prev) => {
                    const existingIdx = prev.findIndex(
                      (item) => item.id === receipt.id || item.transactionId === receipt.transactionId
                    );
                    // CRITICAL PROTECTION: If already in history as finalized, DO NOT overwrite as draft!
                    if (existingIdx >= 0 && !prev[existingIdx].isDraft) {
                      return prev;
                    }

                    const draftToPersist: Receipt = {
                      ...receipt,
                      isDraft: true,
                      draftSavedAt: receipt.draftSavedAt || new Date().toISOString(),
                    };

                    let updated: Receipt[];
                    if (existingIdx >= 0) {
                      updated = prev.map((item, idx) => (idx === existingIdx ? draftToPersist : item));
                    } else {
                      updated = [draftToPersist, ...prev];
                    }

                    try {
                      localStorage.setItem('strukku_history', JSON.stringify(updated));
                    } catch (e) {
                      console.error('Error saving history draft on tab switch:', e);
                    }
                    return updated;
                  });
                }
                setActiveView('history');
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer relative ${
                activeView === 'history'
                  ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              id="nav-ledger-history"
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Ledger</span>
              {history.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                  activeView === 'history' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-800'
                }`}>
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              id="nav-sales-analytics"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Statistik</span>
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeView === 'settings'
                  ? 'bg-white text-slate-950 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              id="nav-app-settings"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          </nav>

          {/* Header Utilities */}
          <div className="flex items-center gap-2">
            <div 
              className="flex items-center gap-1.5 border border-emerald-500/25 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50/80 text-emerald-800 shadow-2xs"
              title="Autosave aktif. Draf struk tersimpan otomatis secara instan di perangkat Anda."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-[11px] font-medium hidden sm:inline">Autosave Aktif</span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-700 shadow-2xs">
              <span className="text-slate-400 text-[11px]">Mata Uang:</span>
              <span className="text-slate-900 font-mono font-bold">{currencySymbol}</span>
            </div>
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
                defaultStoreName={defaultStoreName}
                onSetDefaultStoreName={handleSetDefaultStoreName}
                defaultStoreAddress={defaultStoreAddress}
                onSetDefaultStoreAddress={handleSetDefaultStoreAddress}
                defaultCashierName={defaultCashierName}
                onSetDefaultCashierName={handleSetDefaultCashierName}
                defaultStorePhone={defaultStorePhone}
                onSetDefaultStorePhone={handleSetDefaultStorePhone}
                lastAutosavedAt={lastAutosavedAt}
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
              archivedHistory={archivedHistory}
              trashHistory={trashHistory}
              onLoadReceipt={handleLoadReceipt}
              onUpdateReceipt={handleUpdateReceipt}
              onTogglePinReceipt={handleTogglePinReceipt}
              onClearHistory={handleClearHistory}
              onClearDrafts={handleClearDrafts}
              onFinalizeReceipt={handleFinalizeReceipt}
              onFinalizeAllDrafts={handleFinalizeAllDrafts}
              onNavigateToGenerator={() => setActiveView('generator')}
              onArchiveReceipt={handleArchiveReceipt}
              onBulkArchiveReceipts={handleBulkArchiveReceipts}
              onArchiveAllHistory={handleArchiveAllHistory}
              onUnarchiveReceipt={handleUnarchiveReceipt}
              onUnarchiveAll={handleUnarchiveAll}
              onDeleteReceipt={handleDeleteReceipt}
              onBulkDeleteReceipts={handleBulkDeleteReceipts}
              onDeleteArchivedReceipt={handleDeleteArchivedReceipt}
              onClearArchivedHistory={handleClearArchivedHistory}
              onRestoreReceipt={handleRestoreReceipt}
              onRestoreAllTrash={handleRestoreAllTrash}
              onPermanentDeleteReceipt={handlePermanentDeleteReceipt}
              onEmptyTrash={handleEmptyTrash}
              onImportHistory={handleImportHistory}
              onBulkFinalizeDrafts={handleBulkFinalizeDrafts}
              onBulkUnarchiveReceipts={handleBulkUnarchiveReceipts}
              onBulkDeleteArchivedReceipts={handleBulkDeleteArchivedReceipts}
              onBulkRestoreTrash={handleBulkRestoreTrash}
              onBulkPermanentDeleteTrash={handleBulkPermanentDeleteTrash}
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

        {/* VIEW 4: APP SETTINGS, BACKUP & RESET */}
        {activeView === 'settings' && (
          <div className="h-full">
            <Settings
              history={history}
              receipt={receipt}
              currencySymbol={currencySymbol}
              onSetCurrencySymbol={setCurrencySymbol}
              defaultStoreName={defaultStoreName}
              onSetDefaultStoreName={handleSetDefaultStoreName}
              defaultStoreAddress={defaultStoreAddress}
              onSetDefaultStoreAddress={handleSetDefaultStoreAddress}
              defaultCashierName={defaultCashierName}
              onSetDefaultCashierName={handleSetDefaultCashierName}
              defaultStorePhone={defaultStorePhone}
              onSetDefaultStorePhone={handleSetDefaultStorePhone}
              onResetAllData={handleResetAllData}
              onRestoreBackup={handleRestoreBackup}
              showToast={showToast}
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
