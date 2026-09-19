/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ReceiptGroup } from '../types';
import { 
  FolderPlus, 
  X, 
  Plus, 
  Check, 
  Folder, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';

interface AddToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReceiptIds: string[];
  groups: ReceiptGroup[];
  onCreateGroup?: (name: string, description?: string, color?: string) => ReceiptGroup | void;
  onAddReceiptsToGroup?: (groupId: string, receiptIds: string[]) => void;
  onClearSelection?: () => void;
  currencySymbol: string;
}

const GROUP_COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', light: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'emerald', label: 'Hijau', bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'amber', label: 'Kuning', bg: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'rose', label: 'Merah', bg: 'bg-rose-500', light: 'bg-rose-50 border-rose-200 text-rose-700' },
  { id: 'blue', label: 'Biru', bg: 'bg-blue-500', light: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'purple', label: 'Ungu', bg: 'bg-purple-500', light: 'bg-purple-50 border-purple-200 text-purple-700' },
];

export default function AddToGroupModal({
  isOpen,
  onClose,
  selectedReceiptIds,
  groups,
  onCreateGroup,
  onAddReceiptsToGroup,
  onClearSelection,
}: AddToGroupModalProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [addedGroupId, setAddedGroupId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    if (onCreateGroup) {
      const created = onCreateGroup(newGroupName.trim(), '', selectedColor);
      const targetId = (created as ReceiptGroup)?.id;
      if (targetId && onAddReceiptsToGroup) {
        onAddReceiptsToGroup(targetId, selectedReceiptIds);
      }
    }
    setNewGroupName('');
    setIsCreatingNew(false);
    onClearSelection?.();
    onClose();
  };

  const handleSelectGroup = (groupId: string) => {
    if (onAddReceiptsToGroup) {
      onAddReceiptsToGroup(groupId, selectedReceiptIds);
    }
    setAddedGroupId(groupId);
    setTimeout(() => {
      onClearSelection?.();
      onClose();
      setAddedGroupId(null);
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      id="modal-add-to-group-backdrop"
    >
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="modal-add-to-group-container"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Masukkan ke Grup
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-bold text-indigo-600">{selectedReceiptIds.length} struk terpilih</span> akan dimasukkan ke dalam grup.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Tutup dialog"
            id="btn-close-add-to-group-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Quick Create Group Section */}
          <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Buat Grup Baru Langsung</span>
              </span>
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 cursor-pointer transition"
                  id="btn-show-create-group-form"
                >
                  + Tambah Baru
                </button>
              )}
            </div>

            {isCreatingNew ? (
              <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nama grup (misal: Rekap Kantor, Proyek B, dll)..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none font-medium text-slate-800"
                    autoFocus
                    id="input-new-group-name"
                  />
                  <button
                    type="submit"
                    disabled={!newGroupName.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                    id="btn-submit-create-group"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat & Masukkan</span>
                  </button>
                </div>

                {/* Color choices */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 font-medium mr-1">Warna label:</span>
                  {GROUP_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedColor(col.id)}
                      className={`w-5 h-5 rounded-full ${col.bg} transition transform ${
                        selectedColor === col.id ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={col.label}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 ml-auto cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-indigo-900/70">
                Pilih salah satu grup yang sudah dibuat di bawah, atau klik <strong>+ Tambah Baru</strong> untuk membuat wadah grup baru.
              </p>
            )}
          </div>

          {/* Existing Groups List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Daftar Grup Tersedia ({groups.length})
              </span>
            </div>

            {groups.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
                <Folder className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">Belum ada grup yang dibuat</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                  Grup membantu mengumpulkan struk transaksi sejenis. Buat grup pertama Anda menggunakan formulir di atas.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-100" id="list-available-groups">
                {groups.map((group) => {
                  const alreadyInCount = selectedReceiptIds.filter((id) =>
                    group.receiptIds.includes(id)
                  ).length;
                  const allAlreadyIn = alreadyInCount === selectedReceiptIds.length;
                  const isSuccess = addedGroupId === group.id;

                  const colorObj = GROUP_COLORS.find((c) => c.id === group.color) || GROUP_COLORS[0];

                  return (
                    <div
                      key={group.id}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg ${colorObj.light} shrink-0`}>
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {group.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500">
                              {group.receiptIds.length} struk di dalam grup
                            </span>
                            {alreadyInCount > 0 && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                allAlreadyIn 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {allAlreadyIn ? 'Semua sudah ada' : `${alreadyInCount} sudah ada`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Prominent '+' Button as requested */}
                      <button
                        type="button"
                        onClick={() => handleSelectGroup(group.id)}
                        disabled={allAlreadyIn || isSuccess}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs ${
                          isSuccess
                            ? 'bg-emerald-600 text-white'
                            : allAlreadyIn
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                        }`}
                        title={
                          allAlreadyIn
                            ? 'Semua struk yang dipilih sudah berada di dalam grup ini'
                            : `Masukkan ${selectedReceiptIds.length} struk ke grup ${group.name}`
                        }
                        id={`btn-add-to-group-${group.id}`}
                      >
                        {isSuccess ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Dimasukkan</span>
                          </>
                        ) : allAlreadyIn ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Sudah Ada</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Pilih</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Hanya struk di tab <strong>Semua Riwayat</strong> yang dapat dikelompokkan.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
            id="btn-close-group-modal-bottom"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
