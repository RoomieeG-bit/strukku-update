/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Printer, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Check, 
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../utils';

export type ActionType = 'PRINT' | 'PDF' | 'JPG' | 'PNG' | 'SAVE';

interface PaymentWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: ActionType;
  receiptTotal: number;
  cashReceived: number;
  paymentMethod: string;
  paymentStatus: string;
  currencySymbol: string;
}

export default function PaymentWarningModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  receiptTotal,
  cashReceived,
  paymentMethod,
  paymentStatus,
  currencySymbol,
}: PaymentWarningModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const deficit = Math.max(0, receiptTotal - (paymentMethod === 'CASH' ? cashReceived : 0));

  const getActionLabel = () => {
    switch (actionType) {
      case 'PRINT':
        return {
          title: 'Cetak Thermal Struk',
          icon: <Printer className="w-4 h-4 text-amber-600" />,
          btnText: 'Tetap Cetak Struk',
        };
      case 'PDF':
        return {
          title: 'Ekspor Dokumen PDF',
          icon: <Download className="w-4 h-4 text-amber-600" />,
          btnText: 'Tetap Ekspor PDF',
        };
      case 'JPG':
        return {
          title: 'Ekspor Gambar JPG',
          icon: <ImageIcon className="w-4 h-4 text-amber-600" />,
          btnText: 'Tetap Ekspor JPG',
        };
      case 'PNG':
        return {
          title: 'Ekspor Gambar PNG',
          icon: <ImageIcon className="w-4 h-4 text-amber-600" />,
          btnText: 'Tetap Ekspor PNG',
        };
      case 'SAVE':
        return {
          title: 'Simpan Struk ke Riwayat',
          icon: <FileText className="w-4 h-4 text-amber-600" />,
          btnText: 'Tetap Simpan Struk',
        };
      default:
        return {
          title: 'Lanjutkan Tindakan',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          btnText: 'Ya, Lanjutkan',
        };
    }
  };

  const actionInfo = getActionLabel();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      id="payment-warning-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white border border-amber-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn"
        id="payment-warning-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-warning-title"
      >
        {/* Warning Accent Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-rose-500 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-100">
                Peringatan Transaksi Kasir
              </span>
              <h3 id="payment-warning-title" className="text-sm font-extrabold text-white">
                Pembayaran Kurang
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Main User Prompt Sentence */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3.5 text-slate-800">
            <p className="text-sm sm:text-base font-bold text-amber-950 text-center leading-relaxed">
              &ldquo;Pembayaran kurang, apakah anda ingin melanjutkan?&rdquo;
            </p>
            <div className="mt-2 text-center text-xs text-amber-800 flex items-center justify-center gap-1.5 font-medium">
              <span>Tindakan tertunda:</span>
              <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md bg-white border border-amber-200 text-slate-800 shadow-2xs">
                {actionInfo.icon}
                {actionInfo.title}
              </span>
            </div>
          </div>

          {/* Breakdown of Payment Numbers */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Total Tagihan Belanja:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(receiptTotal, currencySymbol)}
              </span>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">Uang Tunai Diterima:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatCurrency(cashReceived, currencySymbol)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Status Pelunasan:</span>
              <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                paymentStatus === 'SUDAH_LUNAS'
                  ? 'bg-emerald-100 text-emerald-800'
                  : paymentStatus === 'HUTANG'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {paymentStatus === 'SUDAH_LUNAS' ? 'Sudah Lunas' : paymentStatus === 'HUTANG' ? 'Hutang' : 'Belum Lunas'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-rose-600 font-bold">
              <span>Kekurangan Pembayaran:</span>
              <span className="font-mono text-sm">
                - {formatCurrency(deficit > 0 ? deficit : receiptTotal, currencySymbol)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Catatan: Jika Anda memilih melanjutkan, struk akan tetap diproses dengan status atau nominal saat ini. Anda juga dapat membatalkan untuk memperbaiki input pembayaran di tab kasir.
          </p>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
            id="btn-cancel-payment-warning"
          >
            Batal / Periksa Pembayaran
          </button>
          
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            id="btn-confirm-payment-warning"
          >
            <Check className="w-4 h-4" />
            <span>Ya, Lanjutkan ({actionInfo.title})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
