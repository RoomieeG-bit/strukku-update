/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Receipt, ReceiptGroup } from '../types';
import { formatCurrency, formatDateTime, exportReceiptsToCSV } from '../utils';
import { 
  Folder, 
  FolderPlus, 
  FolderOpen,
  Plus, 
  Minus, 
  Pencil, 
  Trash2, 
  Search, 
  X, 
  Check, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Layers, 
  Tag, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronRight, 
  Sparkles,
  Info
} from 'lucide-react';

interface ReceiptGroupsTabProps {
  groups: ReceiptGroup[];
  allReceipts: Receipt[]; // All receipts from active history & archived
  currencySymbol: string;
  onCreateGroup?: (name: string, description?: string, color?: string) => ReceiptGroup | void;
  onUpdateGroup?: (id: string, updates: Partial<ReceiptGroup>) => void;
  onDeleteGroup?: (id: string) => void;
  onRemoveReceiptFromGroup?: (groupId: string, receiptId: string) => void;
  onLoadReceipt: (receipt: Receipt) => void;
  onEditReceipt?: (receipt: Receipt) => void;
  onNavigateToActiveTab: () => void;
}

const GROUP_COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', border: 'border-indigo-200', light: 'bg-indigo-50 text-indigo-700' },
  { id: 'emerald', label: 'Hijau', bg: 'bg-emerald-500', border: 'border-emerald-200', light: 'bg-emerald-50 text-emerald-700' },
  { id: 'amber', label: 'Kuning', bg: 'bg-amber-500', border: 'border-amber-200', light: 'bg-amber-50 text-amber-700' },
  { id: 'rose', label: 'Merah', bg: 'bg-rose-500', border: 'border-rose-200', light: 'bg-rose-50 text-rose-700' },
  { id: 'blue', label: 'Biru', bg: 'bg-blue-500', border: 'border-blue-200', light: 'bg-blue-50 text-blue-700' },
  { id: 'purple', label: 'Ungu', bg: 'bg-purple-500', border: 'border-purple-200', light: 'bg-purple-50 text-purple-700' },
];

export default function ReceiptGroupsTab({
  groups,
  allReceipts,
  currencySymbol,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onRemoveReceiptFromGroup,
  onLoadReceipt,
  onEditReceipt,
  onNavigateToActiveTab,
}: ReceiptGroupsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroupIds, setExpandedGroupIds] = useState<string[]>(() => {
    // Expand first group by default if exists
    return groups.length > 0 ? [groups[0].id] : [];
  });
  
  // State for creating group
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('indigo');

  // State for renaming group (Buat grup bisa diubah namanya)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // State for delete confirmation modal
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<ReceiptGroup | null>(null);

  // Toggle accordion expand
  const handleToggleExpand = (groupId: string) => {
    setExpandedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  // Expand or collapse all
  const handleToggleExpandAll = () => {
    if (expandedGroupIds.length === groups.length) {
      setExpandedGroupIds([]);
    } else {
      setExpandedGroupIds(groups.map((g) => g.id));
    }
  };

  // Handle submit create group
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    if (onCreateGroup) {
      const created = onCreateGroup(newGroupName.trim(), '', newGroupColor);
      if (created && (created as ReceiptGroup).id) {
        setExpandedGroupIds((prev) => [...prev, (created as ReceiptGroup).id]);
      }
    }
    setNewGroupName('');
    setIsCreatingGroup(false);
  };

  // Handle start rename
  const handleStartRename = (group: ReceiptGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  // Handle save rename
  const handleSaveRename = (groupId: string) => {
    if (!editingGroupName.trim()) return;
    if (onUpdateGroup) {
      onUpdateGroup(groupId, { name: editingGroupName.trim() });
    }
    setEditingGroupId(null);
  };

  // Export receipts of a specific group to CSV
  const handleExportGroupCSV = (group: ReceiptGroup, receipts: Receipt[]) => {
    if (receipts.length === 0) return;
    const sanitizedName = group.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    exportReceiptsToCSV(receipts, `rekap_grup_${sanitizedName}.csv`);
  };

  // Filter groups by search term
  const filteredGroups = groups.filter((group) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    if (group.name.toLowerCase().includes(term)) return true;
    
    // Also check if any receipt in group matches
    const groupReceipts = (group.receiptIds || [])
      .map((id) => allReceipts.find((r) => r.id === id))
      .filter(Boolean) as Receipt[];

    return groupReceipts.some((r) =>
      r.storeName.toLowerCase().includes(term) ||
      r.transactionId.toLowerCase().includes(term) ||
      (r.customerName && r.customerName.toLowerCase().includes(term)) ||
      (r.cashierName && r.cashierName.toLowerCase().includes(term)) ||
      r.items.some((it) => it.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
      {/* Groups Sub-Header & Controls */}
      <div className="p-4 border-b border-slate-100 bg-white space-y-3 shrink-0">
        {/* Banner Info */}
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                <span>Grup Struk Transaksi</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-200/80 text-indigo-900">
                  {groups.length} Grup
                </span>
              </h4>
              <p className="text-[11px] text-indigo-900/85 mt-0.5 leading-relaxed">
                Kelola kumpulan struk belanja berdasarkan proyek, divisi, pelanggan, atau kategori. Pilih struk di tab <strong>Semua Riwayat</strong> lalu klik <strong>Masukkan ke Grup</strong> untuk menambahkannya.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setIsCreatingGroup(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
              id="btn-create-new-group-header"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Grup Baru</span>
            </button>
          </div>
        </div>

        {/* Search Bar & View Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama grup atau nama transaksi di dalam grup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50/70 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition shadow-2xs"
              id="groups-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {groups.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                id="btn-toggle-expand-all-groups"
              >
                {expandedGroupIds.length === groups.length ? 'Tutup Semua' : 'Buka Semua'}
              </button>
            </div>
          )}
        </div>

        {/* Inline Create Group Card (if active) */}
        {isCreatingGroup && (
          <div className="bg-white border border-indigo-200 rounded-xl p-3.5 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Buat Grup Struk Baru</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingGroup(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama grup (misal: Rekap Proyek Alpha, Katering Kantor)..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none font-medium text-slate-800"
                  autoFocus
                  id="input-create-group-name"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!newGroupName.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    id="btn-confirm-create-group"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Simpan Grup</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Color picker */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-medium">Warna Tema Grup:</span>
                <div className="flex items-center gap-1.5">
                  {GROUP_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewGroupColor(col.id)}
                      className={`w-6 h-6 rounded-full ${col.bg} transition transform ${
                        newGroupColor === col.id ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={col.label}
                    />
                  ))}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groups.length === 0 ? (
          /* Empty state: No groups yet */
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[350px]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 mb-3 shadow-xs">
              <FolderPlus className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Belum Ada Grup Struk
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md text-center leading-relaxed">
              Grup memungkinkan Anda mengelompokkan beberapa struk transaksi ke dalam satu wadah rapi. 
              Pilih struk dari tab <strong>Semua Riwayat</strong> dengan bulk-action, lalu klik <strong>Masukkan ke Grup</strong>.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreatingGroup(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                id="btn-empty-create-group"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Grup Pertama</span>
              </button>
              <button
                type="button"
                onClick={onNavigateToActiveTab}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
                id="btn-nav-to-active-history"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Pilih Struk di Semua Riwayat</span>
              </button>
            </div>
          </div>
        ) : filteredGroups.length === 0 ? (
          /* Empty search result */
          <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center">
            <Search className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada grup yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">
              Tidak ditemukan grup dengan kata kunci pencarian &quot;{searchTerm}&quot;.
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="mt-3 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Bersihkan Pencarian
            </button>
          </div>
        ) : (
          /* List of Groups */
          <div className="space-y-4" id="receipt-groups-list">
            {filteredGroups.map((group) => {
              const isExpanded = expandedGroupIds.includes(group.id);
              const colorObj = GROUP_COLORS.find((c) => c.id === group.color) || GROUP_COLORS[0];

              // Resolve receipts in this group
              const groupReceipts = (group.receiptIds || [])
                .map((id) => allReceipts.find((r) => r.id === id))
                .filter(Boolean) as Receipt[];

              // Calculate group totals
              const groupTotalRevenue = groupReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
              const groupTotalItemsCount = groupReceipts.reduce(
                (sum, r) => sum + (r.items || []).reduce((itemSum, it) => itemSum + (it.quantity || 0), 0),
                0
              );

              const isEditingThisGroup = editingGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition hover:border-slate-300"
                  id={`group-card-${group.id}`}
                >
                  {/* Group Card Header */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(group.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title={isExpanded ? 'Tutup daftar struk' : 'Buka rincian struk'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>

                      <div className={`p-2.5 rounded-xl ${colorObj.light} shrink-0`}>
                        <Folder className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditingThisGroup ? (
                          /* Rename Group Inline Form ("Buat grup bisa diubah namanya") */
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(group.id);
                                if (e.key === 'Escape') setEditingGroupId(null);
                              }}
                              className="px-2.5 py-1 text-sm font-bold text-slate-900 bg-white border border-indigo-500 rounded-lg focus:ring-2 focus:ring-indigo-600/20 outline-none"
                              autoFocus
                              id={`input-rename-group-${group.id}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(group.id)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                              title="Simpan nama grup"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingGroupId(null)}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          /* Normal Display with Rename Pencil Button */
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 font-display truncate">
                              {group.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleStartRename(group)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                              title="Ubah nama grup ini"
                              id={`btn-rename-group-${group.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {groupReceipts.length} Struk
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Dibuat {formatDateTime(group.createdAt).split(' ')[0]}</span>
                          </span>
                          <span className="font-semibold text-slate-700">
                            Total Omset: <strong className="text-slate-900 font-mono">{formatCurrency(groupTotalRevenue, currencySymbol)}</strong>
                          </span>
                          <span className="text-slate-400">•</span>
                          <span>{groupTotalItemsCount} item barang</span>
                        </div>
                      </div>
                    </div>

                    {/* Group Header Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {groupReceipts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleExportGroupCSV(group, groupReceipts)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                          title="Ekspor seluruh struk di grup ini ke berkas CSV Excel"
                          id={`btn-export-group-csv-${group.id}`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="hidden sm:inline">Ekspor CSV</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartRename(group)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Ubah nama grup"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ubah Nama</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmGroup(group)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Hapus grup ini (struk di dalamnya tetap tersimpan di riwayat)"
                        id={`btn-delete-group-${group.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus Grup</span>
                      </button>
                    </div>
                  </div>

                  {/* Group Receipts Content (Accordion) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
                      {groupReceipts.length === 0 ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
                          <Folder className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-700">
                            Grup ini masih kosong
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                            Belum ada struk yang dimasukkan ke grup &quot;{group.name}&quot;. Buka tab <strong>Semua Riwayat</strong>, centang beberapa struk, lalu klik <strong>Masukkan ke Grup</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={onNavigateToActiveTab}
                            className="mt-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Pilih Struk di Semua Riwayat</span>
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                            <span>Menampilkan {groupReceipts.length} transaksi di grup ini</span>
                            <span className="font-semibold text-slate-700">
                              Rata-rata: <strong className="font-mono">{formatCurrency(groupTotalRevenue / groupReceipts.length, currencySymbol)}</strong>
                            </span>
                          </div>

                          {groupReceipts.map((receipt) => {
                            const totalQty = (receipt.items || []).reduce((s, it) => s + (it.quantity || 0), 0);

                            return (
                              <div
                                key={receipt.id}
                                className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-200"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800 text-sm font-display truncate">
                                      {receipt.storeName}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      #{receipt.transactionId.split('/')[0]}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {receipt.paymentMethod}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                      (receipt.paymentStatus || 'SUDAH_LUNAS') === 'SUDAH_LUNAS'
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                      {(receipt.paymentStatus || 'SUDAH_LUNAS') === 'SUDAH_LUNAS' ? 'Lunas' : 'Belum Lunas'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      <span>{formatDateTime(receipt.dateTime)}</span>
                                    </span>
                                    {receipt.customerName && (
                                      <span className="flex items-center gap-1 text-slate-600">
                                        <User className="w-3 h-3 text-slate-400" />
                                        <span>{receipt.customerName}</span>
                                      </span>
                                    )}
                                    <span className="text-slate-400">•</span>
                                    <span>{totalQty} pcs ({receipt.items.length} item)</span>
                                  </div>

                                  {/* Item chips preview */}
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {receipt.items.slice(0, 3).map((it, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                                      >
                                        {it.name} <strong className="text-slate-900 font-bold">x{it.quantity}</strong>
                                      </span>
                                    ))}
                                    {receipt.items.length > 3 && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold">
                                        +{receipt.items.length - 3} lainnya
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side: Total & Actions */}
                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total</span>
                                    <span className="text-sm font-mono font-bold text-slate-900">
                                      {formatCurrency(receipt.total, currencySymbol)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {/* Load to Generator */}
                                    <button
                                      type="button"
                                      onClick={() => onLoadReceipt(receipt)}
                                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                                      title="Muat struk ini ke POS Generator"
                                      id={`btn-load-receipt-from-group-${receipt.id}`}
                                    >
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                      <span>Muat</span>
                                    </button>

                                    {/* Edit Receipt */}
                                    {onEditReceipt && (
                                      <button
                                        type="button"
                                        onClick={() => onEditReceipt(receipt)}
                                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                                        title="Edit rincian struk"
                                        id={`btn-edit-receipt-from-group-${receipt.id}`}
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}

                                    {/* Remove from this group */}
                                    <button
                                      type="button"
                                      onClick={() => onRemoveReceiptFromGroup?.(group.id, receipt.id)}
                                      className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                      title="Keluarkan struk ini dari grup"
                                      id={`btn-remove-receipt-from-group-${receipt.id}`}
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                      <span className="text-[11px] hidden sm:inline">Keluarkan</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Group Confirmation Dialog */}
      {deleteConfirmGroup && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setDeleteConfirmGroup(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 max-w-sm w-full space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Hapus Grup Struk?
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus grup <strong>&quot;{deleteConfirmGroup.name}&quot;</strong>?
              <br />
              <span className="text-slate-500 mt-1 block">
                Catatan: Seluruh ({deleteConfirmGroup.receiptIds.length}) struk di dalamnya <strong>tidak akan terhapus</strong> dari riwayat transaksi, hanya wadah grupnya saja yang dihapus.
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmGroup(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGroup?.(deleteConfirmGroup.id);
                  setDeleteConfirmGroup(null);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                id="btn-confirm-delete-group"
              >
                Ya, Hapus Grup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
