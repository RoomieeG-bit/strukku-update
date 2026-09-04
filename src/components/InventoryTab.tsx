/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, Item } from '../types';
import { formatCurrency } from '../utils';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  ShoppingBag, 
  Tag, 
  RefreshCw, 
  PlusCircle, 
  Sparkles, 
  X, 
  CheckCircle2,
  Boxes,
  Download,
  Upload,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface InventoryTabProps {
  onLoadItemToReceipt: (item: InventoryItem, quantity: number) => void;
  currentReceiptItems: Item[];
  currencySymbol: string;
}

// Rich default inventory items representing standard Indonesian retail, cafe, and minimarket goods
const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Kopi Susu Gula Aren',
    category: 'Minuman',
    price: 18000,
    unit: 'cup',
    sku: 'KOP-001',
    stock: 45,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    name: 'Roti Bakar Cokelat Keju',
    category: 'Makanan',
    price: 16000,
    unit: 'porsi',
    sku: 'ROT-002',
    stock: 30,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-3',
    name: 'Indomie Goreng Jumbo',
    category: 'Makanan',
    price: 6000,
    unit: 'bungkus',
    sku: 'IND-003',
    stock: 120,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-4',
    name: 'Aqua Air Mineral 600ml',
    category: 'Minuman',
    price: 4000,
    unit: 'botol',
    sku: 'AQU-004',
    stock: 96,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-5',
    name: 'Teh Botol Sosro 450ml',
    category: 'Minuman',
    price: 5000,
    unit: 'botol',
    sku: 'TEH-005',
    stock: 48,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-6',
    name: 'Susu UHT Ultra Milk 250ml',
    category: 'Minuman',
    price: 7000,
    unit: 'kotak',
    sku: 'SUS-006',
    stock: 60,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-7',
    name: 'Beras Premium SPHP 5kg',
    category: 'Sembako',
    price: 69500,
    unit: 'sak',
    sku: 'BRS-007',
    stock: 25,
    discountRate: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-8',
    name: 'Minyak Goreng SunCo 2L',
    category: 'Sembako',
    price: 35000,
    unit: 'pouch',
    sku: 'MYK-008',
    stock: 40,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-9',
    name: 'Gula Pasir Gulaku 1kg',
    category: 'Sembako',
    price: 17500,
    unit: 'kg',
    sku: 'GUL-009',
    stock: 50,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-10',
    name: 'Telur Ayam Negeri 1kg',
    category: 'Sembako',
    price: 28000,
    unit: 'kg',
    sku: 'TLR-010',
    stock: 35,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-11',
    name: 'Chiki Balls Keju 55g',
    category: 'Snack',
    price: 8500,
    unit: 'bungkus',
    sku: 'CHK-011',
    stock: 60,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-12',
    name: 'Pocari Sweat 500ml',
    category: 'Minuman',
    price: 9000,
    unit: 'botol',
    sku: 'PCR-012',
    stock: 36,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-13',
    name: 'Sabun Mandi Lifebuoy 85g',
    category: 'Kebutuhan Rumah',
    price: 4500,
    unit: 'pcs',
    sku: 'SBN-013',
    stock: 80,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inv-14',
    name: 'Pasta Gigi Pepsodent 190g',
    category: 'Kebutuhan Rumah',
    price: 13500,
    unit: 'pcs',
    sku: 'PEP-014',
    stock: 40,
    discountRate: 0,
    createdAt: new Date().toISOString(),
  },
];

const PRESET_CATEGORIES = ['Semua', 'Makanan', 'Minuman', 'Sembako', 'Snack', 'Kebutuhan Rumah'];

export default function InventoryTab({
  onLoadItemToReceipt,
  currentReceiptItems,
  currencySymbol,
}: InventoryTabProps) {
  // Inventory items list persisted in localStorage
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('strukku_inventory_catalog');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading inventory from localStorage:', e);
    }
    return DEFAULT_INVENTORY_ITEMS;
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Quantity selection map per item { itemId: number }
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});

  // Add / Edit form fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Makanan');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formUnit, setFormUnit] = useState('pcs');
  const [formSku, setFormSku] = useState('');
  const [formStock, setFormStock] = useState<number>(50);
  const [formDiscount, setFormDiscount] = useState<number>(0);

  // Persist items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('strukku_inventory_catalog', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving inventory to localStorage:', e);
    }
  }, [items]);

  // Flash notification helper
  const notifySuccess = (message: string) => {
    setActionSuccessMsg(message);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3500);
  };

  // Get quantity selected for a specific item
  const getItemQty = (id: string) => {
    return qtyMap[id] && qtyMap[id] > 0 ? qtyMap[id] : 1;
  };

  // Change quantity for a specific item
  const changeItemQty = (id: string, delta: number) => {
    setQtyMap((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, Math.min(999, current + delta));
      return { ...prev, [id]: next };
    });
  };

  // Direct load to receipt handler
  const handleLoadToReceipt = (item: InventoryItem) => {
    const qty = getItemQty(item.id);
    onLoadItemToReceipt(item, qty);
    notifySuccess(`Berhasil memuat "${item.name}" (x${qty}) langsung ke struk!`);
  };

  // Handle open add form
  const handleOpenAddForm = () => {
    setEditingItemId(null);
    setFormName('');
    setFormCategory('Makanan');
    setFormPrice(10000);
    setFormUnit('pcs');
    setFormSku(`PRD-${Math.floor(100 + Math.random() * 900)}`);
    setFormStock(50);
    setFormDiscount(0);
    setShowAddForm(true);
  };

  // Handle open edit form
  const handleOpenEditForm = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormName(item.name);
    setFormCategory(item.category || 'Lainnya');
    setFormPrice(item.price);
    setFormUnit(item.unit || 'pcs');
    setFormSku(item.sku || '');
    setFormStock(item.stock ?? 50);
    setFormDiscount(item.discountRate || 0);
    setShowAddForm(true);
  };

  // Handle save (create or update) inventory item
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Mohon masukkan nama barang');
      return;
    }

    if (editingItemId) {
      // Update existing item
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItemId
            ? {
                ...it,
                name: formName.trim(),
                category: formCategory.trim() || 'Lainnya',
                price: Math.max(0, formPrice),
                unit: formUnit.trim() || 'pcs',
                sku: formSku.trim(),
                stock: Math.max(0, formStock),
                discountRate: Math.max(0, Math.min(100, formDiscount)),
              }
            : it
        )
      );
      notifySuccess(`Barang "${formName}" berhasil diperbarui!`);
    } else {
      // Create new inventory item
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        category: formCategory.trim() || 'Lainnya',
        price: Math.max(0, formPrice),
        unit: formUnit.trim() || 'pcs',
        sku: formSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        stock: Math.max(0, formStock),
        discountRate: Math.max(0, Math.min(100, formDiscount)),
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      notifySuccess(`Barang baru "${formName}" berhasil ditambahkan ke inventaris!`);
    }

    setShowAddForm(false);
    setEditingItemId(null);
  };

  // Handle delete item
  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Hapus "${name}" dari daftar barang inventaris?`)) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      notifySuccess(`Barang "${name}" telah dihapus dari inventaris.`);
    }
  };

  // Import items from current active receipt into inventory catalog
  const handleImportFromCurrentReceipt = () => {
    if (currentReceiptItems.length === 0) return;

    let addedCount = 0;
    const existingNames = new Set(items.map((it) => it.name.toLowerCase().trim()));

    const newItemsToAdd: InventoryItem[] = [];
    currentReceiptItems.forEach((rcItem) => {
      const normalized = rcItem.name.toLowerCase().trim();
      if (!existingNames.has(normalized)) {
        existingNames.add(normalized);
        newItemsToAdd.push({
          id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: rcItem.name,
          category: 'Barang Struk',
          price: rcItem.price,
          unit: 'pcs',
          sku: `STR-${Math.floor(100 + Math.random() * 900)}`,
          stock: 50,
          discountRate: rcItem.discountRate || 0,
          createdAt: new Date().toISOString(),
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setItems((prev) => [...newItemsToAdd, ...prev]);
      notifySuccess(`Berhasil mengimpor ${addedCount} barang dari struk aktif ke inventaris!`);
    } else {
      notifySuccess(`Semua barang dalam struk sudah ada dalam inventaris.`);
    }
  };

  // Reset to default sample catalog
  const handleResetCatalog = () => {
    if (window.confirm('Kembalikan daftar barang inventaris ke data bawaan minimarket?')) {
      setItems(DEFAULT_INVENTORY_ITEMS);
      notifySuccess('Katalog inventaris berhasil dikembalikan ke bawaan.');
    }
  };

  // Filtered items list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchCategory =
        selectedCategory === 'Semua' ||
        (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  // Categories present in catalog
  const allCategories = useMemo(() => {
    const cats = new Set(PRESET_CATEGORIES);
    items.forEach((it) => {
      if (it.category) cats.add(it.category);
    });
    return Array.from(cats);
  }, [items]);

  // Check how many times an item is currently in the active receipt
  const getReceiptItemCount = (name: string) => {
    const found = currentReceiptItems.find(
      (it) => it.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-4" id="inventory-tab-section">
      {/* Header Info & Action Controls */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
              <Boxes className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-emerald-950 font-display">
              Barang Inventaris (Katalog POS)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-900">
              {items.length} Barang
            </span>
          </div>
          <p className="text-xs text-emerald-800/90 leading-relaxed">
            Katalog barang siap pakai. Klik <strong>"Muat ke Struk"</strong> untuk langsung memasukkan barang ke struk aktif tanpa perlu mengetik ulang!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentReceiptItems.length > 0 && (
            <button
              type="button"
              onClick={handleImportFromCurrentReceipt}
              className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Simpan barang yang sedang ada di struk ke katalog inventaris"
              id="btn-import-from-receipt"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Simpan dari Struk ({currentReceiptItems.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddForm}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
            id="btn-add-inventory-item"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Barang Baru</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="p-1 text-emerald-800 hover:text-emerald-950 rounded cursor-pointer"
            title="Tutup pesan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama barang, kategori, atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition"
            id="inventory-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ADD / EDIT ITEM DRAWER/FORM */}
      {showAddForm && (
        <form
          onSubmit={handleSaveForm}
          className="bg-slate-50 border-2 border-emerald-500/40 rounded-2xl p-4 space-y-4 shadow-sm"
          id="inventory-form-add-edit"
        >
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-emerald-600 text-white rounded-md">
                {editingItemId ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </span>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {editingItemId ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris Baru'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
              title="Tutup form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Nama Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Kopi Susu Aren, Roti Bakar..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                id="input-inventory-name"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kategori
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Minuman / Makanan..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  id="input-inventory-category"
                />
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {['Makanan', 'Minuman', 'Sembako', 'Snack', 'Kebutuhan Rumah'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Harga Jual Satuan ({currencySymbol}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={formPrice || ''}
                onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                placeholder="15000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                id="input-inventory-price"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Satuan Kemasan (Unit)
              </label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="pcs, botol, porsi, cup, kg..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                id="input-inventory-unit"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kode / SKU Barang (Opsional)
              </label>
              <input
                type="text"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                placeholder="PRD-001"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                id="input-inventory-sku"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Stok Awal (Opsional)
              </label>
              <input
                type="number"
                min="0"
                value={formStock || ''}
                onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                placeholder="50"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                id="input-inventory-stock"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Diskon Bawaan (%) (Opsional)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formDiscount || ''}
                onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                id="input-inventory-discount"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
              id="btn-save-inventory"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editingItemId ? 'Simpan Perubahan' : 'Tambahkan ke Inventaris'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ITEMS CATALOG LIST / GRID */}
      {filteredItems.length === 0 ? (
        <div className="p-10 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">Tidak ada barang yang cocok</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'Semua'
              ? 'Tidak ditemukan barang dengan filter pencarian tersebut.'
              : 'Belum ada barang di inventaris.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {(searchQuery || selectedCategory !== 'Semua') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Semua');
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Reset Pencarian
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer"
            >
              + Tambah Barang Baru
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="inventory-items-grid">
          {filteredItems.map((item) => {
            const currentCountInReceipt = getReceiptItemCount(item.name);
            const selectedQty = getItemQty(item.id);

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-emerald-300 rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group"
                id={`inventory-card-${item.id}`}
              >
                {/* Top: Name, Category, Price */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {item.category || 'Barang'}
                        </span>
                        {item.sku && (
                          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.sku}
                          </span>
                        )}
                        {item.stock !== undefined && (
                          <span className="text-[9px] font-semibold text-slate-400">
                            Stok: {item.stock} {item.unit || 'pcs'}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm truncate" title={item.name}>
                        {item.name}
                      </h4>
                    </div>

                    {/* Edit & Delete Action icons */}
                    <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(item)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                        title="Edit rincian barang"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Hapus barang dari inventaris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Current Receipt Indicator */}
                  <div className="flex items-baseline justify-between mt-2 mb-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {formatCurrency(item.price, currencySymbol)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        /{item.unit || 'pcs'}
                      </span>
                      {item.discountRate && item.discountRate > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-100">
                          Disc {item.discountRate}%
                        </span>
                      )}
                    </div>

                    {currentCountInReceipt > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 shadow-2xs">
                        <Check className="w-2.5 h-2.5" /> Di struk: {currentCountInReceipt}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom: Quantity Selector & "Muat Langsung ke Struk" Button */}
                <div className="border-t border-slate-100 pt-2.5 flex items-center gap-2">
                  {/* Qty Stepper */}
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => changeItemQty(item.id, -1)}
                      className="px-2 py-1 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
                      title="Kurangi kuantitas"
                    >
                      -
                    </button>
                    <span className="px-2 font-mono text-xs font-bold text-slate-800 min-w-[24px] text-center">
                      {selectedQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeItemQty(item.id, 1)}
                      className="px-2 py-1 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
                      title="Tambah kuantitas"
                    >
                      +
                    </button>
                  </div>

                  {/* Prominent "+ Muat ke Struk" button */}
                  <button
                    type="button"
                    onClick={() => handleLoadToReceipt(item)}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                    title={`Muat ${selectedQty} ${item.unit || 'pcs'} ${item.name} langsung ke struk`}
                    id={`btn-load-item-${item.id}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Muat ke Struk</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info & Catalog Reset */}
      <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <span>Barang inventaris tersimpan di memori lokal peramban Anda.</span>
        <button
          type="button"
          onClick={handleResetCatalog}
          className="text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
          title="Kembalikan barang ke contoh standar retail"
        >
          Reset ke Katalog Standar
        </button>
      </div>
    </div>
  );
}
