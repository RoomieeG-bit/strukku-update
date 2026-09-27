/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Receipt } from '../types';
import { formatCurrency, formatDateTime } from '../utils';
import { 
  Link, 
  Search, 
  X, 
  Calendar, 
  User, 
  ShoppingBag, 
  CheckCircle, 
  Clock, 
  FileText,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface ChainReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: Receipt[];
  onSelectReceipt: (parentReceipt: Receipt) => void;
  currencySymbol: string;
}

export default function ChainReceiptModal({
  isOpen,
  onClose,
  receipts,
  onSelectReceipt,
  currencySymbol,
}: ChainReceiptModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out drafts or corrupted receipts; only active finished receipts can be chained
  const validReceipts = useMemo(() => {
    return receipts.filter((r) => !r.isDraft);
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return validReceipts;

    return validReceipts.filter((r) => {
      const matchTxId = r.transactionId.toLowerCase().includes(q);
      const matchStore = (r.storeName || '').toLowerCase().includes(q);
      const matchCustomer = (r.customerName || '').toLowerCase().includes(q);
      const matchCashier = (r.cashierName || '').toLowerCase().includes(q);
      const matchDate = (r.dateTime || '').toLowerCase().includes(q);
      const matchItems = (r.items || []).some((item) => item.name.toLowerCase().includes(q));

      return matchTxId || matchStore || matchCustomer || matchCashier || matchDate || matchItems;
    });
  }, [validReceipts, searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      id="chain-receipt-modal-backdrop"
    >
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        id="chain-receipt-modal-container"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-xs font-bold">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                Pilih Struk untuk Rantai Struk
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Chain Mode
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Struk baru akan bersambung dengan struk asal (misalnya untuk Refund, Retur, atau Koreksi).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Tutup dialog"
            id="btn-close-chain-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari struk berdasarkan ID, Toko, Pelanggan, Kasir, atau Nama Barang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-slate-800 transition"
              autoFocus
              id="input-chain-search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500">
            <span>Menampilkan <strong>{filteredReceipts.length}</strong> struk riwayat</span>
            <span className="text-amber-800 font-medium">💡 Pengaturan toko akan dikunci mengikuti struk asal</span>
          </div>
        </div>

        {/* Receipts List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/50" id="chain-receipts-list">
          {validReceipts.length === 0 ? (
            <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center">
              <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Belum Ada Struk di Riwayat</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Untuk membuat Rantai Struk (Refund/Retur), Anda perlu memiliki minimal 1 struk transaksi yang telah disimpan di Semua Riwayat.
              </p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center">
              <div className="p-3 rounded-full bg-amber-50 text-amber-500 mb-2">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">Tidak ada struk yang cocok dengan "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs font-bold text-amber-700 hover:underline cursor-pointer"
              >
                Reset pencarian
              </button>
            </div>
          ) : (
            filteredReceipts.map((receiptItem) => {
              const isAlreadyChained = receiptItem.isChained;
              const hasChildChains = validReceipts.some((r) => r.parentReceiptId === receiptItem.id);

              return (
                <div
                  key={receiptItem.id}
                  className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md rounded-xl p-3.5 sm:p-4 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        #{receiptItem.transactionId}
                      </span>

                      {/* Status Badges */}
                      {receiptItem.paymentStatus === 'REFUND' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          ↩️ Refund
                        </span>
                      ) : receiptItem.paymentStatus === 'BELUM_LUNAS' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          ⏳ Belum Lunas
                        </span>
                      ) : receiptItem.paymentStatus === 'HUTANG' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          💸 Hutang
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✅ Lunas
                        </span>
                      )}

                      {/* Existing Chain indicators */}
                      {isAlreadyChained && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <Link className="w-3 h-3" />
                          Rantai dari #{receiptItem.parentTransactionId || 'Induk'}
                        </span>
                      )}

                      {hasChildChains && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Link className="w-3 h-3" />
                          Memiliki Rantai Refund
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span className="font-bold text-slate-800">
                        {receiptItem.storeName || 'Toko'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateTime(receiptItem.dateTime)}
                      </span>
                      {receiptItem.customerName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                            <User className="w-3 h-3 text-slate-400" />
                            {receiptItem.customerName}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Items preview snippet */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                      <ShoppingBag className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">
                        {receiptItem.items?.length || 0} barang:
                      </span>
                      <span className="truncate max-w-xs text-slate-500">
                        {(receiptItem.items || []).map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'Kosong'}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block sm:inline mr-1">Total:</span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {formatCurrency(receiptItem.total, currencySymbol)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectReceipt(receiptItem)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs active:scale-95 cursor-pointer"
                      id={`btn-select-chain-receipt-${receiptItem.id}`}
                      title={`Buat rantai struk dari #${receiptItem.transactionId}`}
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>Buat Rantai</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            ⛓️ Rantai struk mengunci info toko dan membuka opsi status <strong>"Refund"</strong>.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold transition cursor-pointer text-xs shadow-2xs"
            id="btn-cancel-chain-modal"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
