/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  Phone, 
  Mail, 
  MapPin, 
  Percent, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Download, 
  Upload, 
  RotateCcw,
  Copy,
  ExternalLink,
  Tag,
  Star,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Budi Santoso',
    phone: '0812-3456-7890',
    email: 'budi.santoso@gmail.com',
    memberId: 'MBR-001',
    category: 'Member',
    discountRate: 5,
    address: 'Jl. Merdeka No. 10, Jakarta Selatan',
    notes: 'Pelanggan setia kopi susu gula aren',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Siti Rahmawati',
    phone: '0813-9876-5432',
    email: 'siti.rahma@yahoo.com',
    memberId: 'VIP-002',
    category: 'VIP',
    discountRate: 10,
    address: 'Bintaro Jaya Sektor 9, Tangerang Selatan',
    notes: 'Member prioritas VIP bulanan',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-3',
    name: 'Agus Setiawan',
    phone: '0857-1122-3344',
    category: 'Reguler',
    address: 'Margonda Raya No. 45, Depok',
    notes: 'Langganan makan siang',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-4',
    name: 'PT. Mandiri Berkah',
    phone: '021-5551234',
    memberId: 'GROSIR-004',
    category: 'Grosir',
    discountRate: 7,
    address: 'Kawasan Industri Pulo Gadung, Jakarta Timur',
    notes: 'Pesanan snack box & catering kantor',
    createdAt: new Date().toISOString(),
  },
];

interface CustomerListTabProps {
  customers: Customer[];
  onUpdateCustomers: (customers: Customer[]) => void;
  onSelectCustomer: (customer: Customer) => void;
  activeCustomerName?: string;
  currencySymbol: string;
}

export default function CustomerListTab({
  customers,
  onUpdateCustomers,
  onSelectCustomer,
  activeCustomerName,
  currencySymbol: _currencySymbol,
}: CustomerListTabProps) {
  // Search and category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal form state (for Add or Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMemberId, setFormMemberId] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Reguler');
  const [formDiscountRate, setFormDiscountRate] = useState<number>(0);
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Toast / feedback message inside tab
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Get all unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.category && c.category.trim()) {
        set.add(c.category.trim());
      }
    });
    return Array.from(set);
  }, [customers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.memberId && c.memberId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'TANPA_KATEGORI' && (!c.category || c.category.trim() === '')) ||
        c.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [customers, searchQuery, selectedCategory]);

  // Open modal for new customer
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormMemberId(`MBR-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategory('Reguler');
    setFormDiscountRate(0);
    setFormAddress('');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing customer
  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone || '');
    setFormEmail(cust.email || '');
    setFormMemberId(cust.memberId || '');
    setFormCategory(cust.category || 'Reguler');
    setFormDiscountRate(cust.discountRate || 0);
    setFormAddress(cust.address || '');
    setFormNotes(cust.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit modal form
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Nama pelanggan tidak boleh kosong.');
      return;
    }

    if (editingCustomer) {
      // Update
      const updatedList = customers.map((c) => {
        if (c.id === editingCustomer.id) {
          return {
            ...c,
            name: trimmedName,
            phone: formPhone.trim() || undefined,
            email: formEmail.trim() || undefined,
            memberId: formMemberId.trim() || undefined,
            category: formCategory.trim() || 'Reguler',
            discountRate: formDiscountRate > 0 ? formDiscountRate : undefined,
            address: formAddress.trim() || undefined,
            notes: formNotes.trim() || undefined,
          };
        }
        return c;
      });
      onUpdateCustomers(updatedList);
      showFeedback(`Pelanggan "${trimmedName}" berhasil diperbarui!`);
    } else {
      // Add new
      const newCust: Customer = {
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: trimmedName,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        memberId: formMemberId.trim() || undefined,
        category: formCategory.trim() || 'Reguler',
        discountRate: formDiscountRate > 0 ? formDiscountRate : undefined,
        address: formAddress.trim() || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onUpdateCustomers([newCust, ...customers]);
      showFeedback(`Pelanggan baru "${trimmedName}" berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  // Delete a customer
  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus pelanggan "${name}" dari list?`)) {
      const updated = customers.filter((c) => c.id !== id);
      onUpdateCustomers(updated);
      showFeedback(`Pelanggan "${name}" dihapus dari list.`);
    }
  };

  // Reset to default list
  const handleResetToDefault = () => {
    if (confirm('Pulihkan daftar pelanggan ke contoh bawaan sistem?')) {
      onUpdateCustomers(DEFAULT_CUSTOMERS);
      showFeedback('Daftar pelanggan dipulihkan ke bawaan awal.');
    }
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customers, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `customer_list_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    showFeedback('Daftar pelanggan berhasil diekspor ke format JSON!');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nama', 'Kategori', 'No. Member', 'Telepon', 'Email', 'Diskon (%)', 'Alamat', 'Catatan'];
    const rows = customers.map((c) => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      `"${(c.memberId || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      c.discountRate || 0,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer_list_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showFeedback('Daftar pelanggan berhasil diekspor ke format CSV!');
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const validated = parsed
            .filter((item) => item && typeof item.name === 'string' && item.name.trim())
            .map((item) => ({
              id: item.id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: item.name.trim(),
              phone: item.phone || undefined,
              email: item.email || undefined,
              memberId: item.memberId || undefined,
              category: item.category || 'Reguler',
              discountRate: typeof item.discountRate === 'number' ? item.discountRate : undefined,
              address: item.address || undefined,
              notes: item.notes || undefined,
              createdAt: item.createdAt || new Date().toISOString(),
            }));

          if (validated.length > 0) {
            onUpdateCustomers(validated);
            showFeedback(`${validated.length} pelanggan berhasil diimpor dari file JSON!`);
          } else {
            showFeedback('File JSON tidak memuat data pelanggan yang valid.');
          }
        }
      } catch (err) {
        console.error('Error importing customers JSON:', err);
        showFeedback('Gagal membaca file JSON. Pastikan format file sesuai.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy phone / text
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper badge for category
  const renderCategoryBadge = (category?: string) => {
    const cat = (category || 'Reguler').toLowerCase();
    if (cat.includes('vip')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
          VIP
        </span>
      );
    }
    if (cat.includes('member')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
          <ShieldCheck className="w-2.5 h-2.5 text-sky-600" />
          Member
        </span>
      );
    }
    if (cat.includes('grosir')) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          <Tag className="w-2.5 h-2.5 text-emerald-600" />
          Grosir
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        {category || 'Reguler'}
      </span>
    );
  };

  return (
    <div className="space-y-4" id="customer-list-tab-panel">
      {/* Toast banner inside component */}
      {feedbackMsg && (
        <div className="bg-emerald-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-100 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Daftar Pelanggan (Customer List)
                <span className="text-xs font-mono font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  {customers.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Kelola data pembeli & member untuk dipilih langsung saat mencetak struk kasir
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              id="btn-add-customer"
            >
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Tambah Pelanggan Baru</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Ekspor CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <label
              htmlFor="import-customer-json"
              className="p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
              title="Impor JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                id="import-customer-json"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/60">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Pelanggan</span>
            <span className="text-base font-bold text-slate-900 font-mono">{customers.length}</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">VIP / Member</span>
            <span className="text-base font-bold text-sky-700 font-mono">
              {customers.filter((c) => (c.category || '').toLowerCase().includes('vip') || (c.category || '').toLowerCase().includes('member')).length}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Punya Diskon</span>
            <span className="text-base font-bold text-amber-700 font-mono">
              {customers.filter((c) => (c.discountRate || 0) > 0).length}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Aktif di Struk</span>
            <span className="text-xs font-bold text-slate-800 truncate block mt-1" title={activeCustomerName || 'Belum dipilih'}>
              {activeCustomerName || <span className="text-slate-400 font-normal italic">Belum dipilih</span>}
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pelanggan, nomor HP, member ID, atau alamat..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua ({customers.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-sky-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat} ({customers.filter((c) => c.category === cat).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer List Display */}
      {filteredCustomers.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {searchQuery ? 'Tidak Ada Pelanggan Yang Cocok' : 'Belum Ada Pelanggan di List'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan pelanggan dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : 'Buat list pelanggan agar Anda bisa memilih nama pembeli langsung melalui dropdown di formulir struk.'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-sky-400" />
              <span>Tambah Pelanggan Baru</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Contoh Pelanggan</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCustomers.map((cust) => {
            const isActiveInReceipt =
              activeCustomerName &&
              activeCustomerName.toLowerCase().trim() === cust.name.toLowerCase().trim();

            return (
              <div
                key={cust.id}
                className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between gap-3 bg-white ${
                  isActiveInReceipt
                    ? 'border-sky-500 shadow-sm ring-2 ring-sky-500/20'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Header card */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{cust.name}</h4>
                        {renderCategoryBadge(cust.category)}
                        {cust.memberId && (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                            {cust.memberId}
                          </span>
                        )}
                      </div>
                      {cust.discountRate && cust.discountRate > 0 ? (
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-1">
                          <Percent className="w-2.5 h-2.5" />
                          <span>Diskon Member {cust.discountRate}%</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(cust)}
                        className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                        title="Edit data pelanggan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Hapus pelanggan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-[11px] text-slate-600 mt-2">
                    {cust.phone && (
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-700">{cust.phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(cust.phone!, `phone-${cust.id}`)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 p-0.5 rounded"
                          title="Salin nomor"
                        >
                          {copiedId === `phone-${cust.id}` ? (
                            <span className="text-emerald-600 font-bold">Disalin</span>
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {cust.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-600">{cust.email}</span>
                      </div>
                    )}

                    {cust.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-500 line-clamp-1">{cust.address}</span>
                      </div>
                    )}

                    {cust.notes && (
                      <p className="text-[10px] text-slate-400 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100 mt-1.5">
                        "{cust.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer card action: Pilih untuk struk */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isActiveInReceipt ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg">
                      <Check className="w-3 h-3 text-sky-600" />
                      Aktif di Struk Ini
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Siap diterapkan ke struk</span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onSelectCustomer(cust);
                      showFeedback(`Pelanggan "${cust.name}" dipilih untuk struk saat ini!`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isActiveInReceipt
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-slate-900 hover:bg-slate-950 text-white shadow-2xs'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isActiveInReceipt ? 'Pilih Ulang' : 'Pilih untuk Struk'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Tambah / Edit Pelanggan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {formError}
                </div>
              )}

              {/* Nama Pelanggan */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Lengkap Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>

              {/* No Member & Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. Member / Kode ID</label>
                  <input
                    type="text"
                    value={formMemberId}
                    onChange={(e) => setFormMemberId(e.target.value)}
                    placeholder="Contoh: MBR-1024"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori / Level</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none cursor-pointer"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Member">Member</option>
                    <option value="VIP">VIP</option>
                    <option value="Grosir">Grosir / Reseller</option>
                    <option value="Karyawan">Karyawan</option>
                  </select>
                </div>
              </div>

              {/* Nomor Telepon & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">No. HP / WhatsApp</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Contoh: 0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Diskon Khusus Member (%) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Diskon Khusus Member (%) <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formDiscountRate || ''}
                    onChange={(e) => setFormDiscountRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    placeholder="0 (tanpa diskon)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold font-mono">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Jika diisi, Anda bisa dengan mudah menerapkan diskon otomatis saat memilih pelanggan ini di struk.
                </p>
              </div>

              {/* Alamat */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Alamat Pelanggan</label>
                <textarea
                  rows={2}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Jl. Nama Jalan No. XX, Kota / Wilayah"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-none"
                />
              </div>

              {/* Catatan Pelanggan */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Misal: Langganan kopi tubruk, sering request nota rangkap, dll."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
