/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ReceiptChainConfig } from '../types';
import { 
  Link2, 
  Utensils, 
  Receipt as ReceiptIcon, 
  FileCheck2, 
  Truck, 
  Hash, 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Info,
  Layers,
  Scissors
} from 'lucide-react';

interface ReceiptChainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainConfig?: ReceiptChainConfig;
  onUpdateConfig: (config: ReceiptChainConfig) => void;
  transactionId: string;
}

export default function ReceiptChainSettingsModal({
  isOpen,
  onClose,
  chainConfig,
  onUpdateConfig,
  transactionId: _transactionId,
}: ReceiptChainSettingsModalProps) {
  if (!isOpen) return null;

  const config: ReceiptChainConfig = chainConfig || {
    enabled: true,
    slips: {
      customer: true,
      kitchen: true,
      merchant: false,
      delivery: false,
    },
    orderType: 'DINE_IN',
    tableNumber: 'Meja 01',
    kitchenNotes: '',
    enableAuditHash: true,
    chainSequence: 1,
  };

  const handleToggleEnabled = (enabled: boolean) => {
    onUpdateConfig({
      ...config,
      enabled,
    });
  };

  const handleToggleSlip = (slipKey: keyof ReceiptChainConfig['slips']) => {
    const updatedSlips = {
      ...config.slips,
      [slipKey]: !config.slips[slipKey],
    };

    // Ensure at least one slip is selected
    const anySelected = Object.values(updatedSlips).some(Boolean);
    if (!anySelected) {
      updatedSlips.customer = true;
    }

    onUpdateConfig({
      ...config,
      slips: updatedSlips,
    });
  };

  // Preset quick templates
  const applyPreset = (preset: 'CAFE_RESTAURANT' | 'RETAIL_STORE' | 'DELIVERY' | 'FULL_CHAIN') => {
    if (preset === 'CAFE_RESTAURANT') {
      onUpdateConfig({
        ...config,
        enabled: true,
        slips: { customer: true, kitchen: true, merchant: false, delivery: false },
        orderType: 'DINE_IN',
        tableNumber: config.tableNumber || 'Meja 01',
      });
    } else if (preset === 'RETAIL_STORE') {
      onUpdateConfig({
        ...config,
        enabled: true,
        slips: { customer: true, kitchen: false, merchant: true, delivery: false },
        orderType: 'TAKE_AWAY',
      });
    } else if (preset === 'DELIVERY') {
      onUpdateConfig({
        ...config,
        enabled: true,
        slips: { customer: true, kitchen: false, merchant: false, delivery: true },
        orderType: 'DELIVERY',
      });
    } else if (preset === 'FULL_CHAIN') {
      onUpdateConfig({
        ...config,
        enabled: true,
        slips: { customer: true, kitchen: true, merchant: true, delivery: true },
      });
    }
  };

  const totalActiveSlips = Object.values(config.slips).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4.5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Pengaturan Receipt Chaining
                <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  Perantaian Struk
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Cetak berantai multi-slip (Pelanggan, Dapur, Salinan Toko, & Resi) dalam satu gulungan kertas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 space-y-4 text-xs">
          {/* Main Master Switch */}
          <div className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
            config.enabled 
              ? 'bg-indigo-50/70 border-indigo-200 ring-2 ring-indigo-500/10' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                config.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Aktifkan Cetak Berantai (Receipt Chaining)
                </span>
                <span className="text-[10px] text-slate-500">
                  {config.enabled 
                    ? `Aktif (${totalActiveSlips} lembar berantai dengan garis potong)` 
                    : 'Nonaktif (hanya mencetak 1 lembar struk biasa)'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Preset Cepat Sesuai Jenis Usaha:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('CAFE_RESTAURANT')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 bg-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Resto & Kafe</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Struk Pelanggan + Tiket Dapur/Bar</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('RETAIL_STORE')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 bg-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Retail & Kasir</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Struk Pelanggan + Salinan Toko/Arsip</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('DELIVERY')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 bg-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Layanan Antar</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Struk + Surat Jalan Pengantaran</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('FULL_CHAIN')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 bg-white text-left transition cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Rantai Penuh (4-in-1)</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Pelanggan, Dapur, Toko, & Surat Jalan</span>
              </button>
            </div>
          </div>

          {/* Slips Selection */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold">
              Pilih Lembar Struk Yang Masuk Dalam Rantai (Chained Slips):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Slip 1: Customer */}
              <div 
                onClick={() => handleToggleSlip('customer')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  config.slips.customer 
                    ? 'border-indigo-500 bg-indigo-50/40 shadow-2xs' 
                    : 'border-slate-200 bg-white opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.slips.customer}
                  onChange={() => {}} // Handled by container
                  className="mt-0.5 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                    <ReceiptIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Struk Pelanggan</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Format lengkap untuk pembeli (rincian item, harga, diskon, pembayaran, dan QR code).
                  </p>
                </div>
              </div>

              {/* Slip 2: Kitchen */}
              <div 
                onClick={() => handleToggleSlip('kitchen')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  config.slips.kitchen 
                    ? 'border-amber-500 bg-amber-50/40 shadow-2xs' 
                    : 'border-slate-200 bg-white opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.slips.kitchen}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-amber-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tiket Dapur / Bar</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Hanya daftar barang, jumlah, no. meja, dan catatan khusus (tanpa mencantumkan nominal harga).
                  </p>
                </div>
              </div>

              {/* Slip 3: Merchant / Office Copy */}
              <div 
                onClick={() => handleToggleSlip('merchant')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  config.slips.merchant 
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-2xs' 
                    : 'border-slate-200 bg-white opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.slips.merchant}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Salinan Toko / Kasir</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Salinan arsip akuntansi internal, ringkasan pembayaran, dan kolom tanda tangan kasir/konsumen.
                  </p>
                </div>
              </div>

              {/* Slip 4: Delivery Slip */}
              <div 
                onClick={() => handleToggleSlip('delivery')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  config.slips.delivery 
                    ? 'border-sky-500 bg-sky-50/40 shadow-2xs' 
                    : 'border-slate-200 bg-white opacity-70 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.slips.delivery}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-sky-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                    <Truck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Surat Jalan & Antar</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                    Lembar serah terima barang kurir: nama, alamat, no. telepon penerima, serta checklist item.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table / Order Info */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Tipe Layanan / Pesanan
              </label>
              <select
                value={config.orderType || 'DINE_IN'}
                onChange={(e) => onUpdateConfig({
                  ...config,
                  orderType: e.target.value as ReceiptChainConfig['orderType'],
                })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="DINE_IN">🍽️ Makan di Tempat (Dine In)</option>
                <option value="TAKE_AWAY">🥡 Bawa Pulang (Take Away)</option>
                <option value="DELIVERY">🛵 Pesanan Antar (Delivery)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Nomor Meja / Kode Antrean
              </label>
              <input
                type="text"
                value={config.tableNumber || ''}
                onChange={(e) => onUpdateConfig({
                  ...config,
                  tableNumber: e.target.value,
                })}
                placeholder="Misal: Meja 05 / Antrean #12"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Kitchen / Order Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Catatan Pesanan / Dapur
            </label>
            <input
              type="text"
              value={config.kitchenNotes || ''}
              onChange={(e) => onUpdateConfig({
                ...config,
                kitchenNotes: e.target.value,
              })}
              placeholder="Misal: Tanpa gula, es dipisah, ekstra saus sambal, jangan pedas..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Cryptographic Audit Chain Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Audit Kriptografis Rantai Transaksi (Chain Hash)</span>
                </div>
                <input
                  type="checkbox"
                  id="enable-audit-hash-cb"
                  checked={config.enableAuditHash !== false}
                  onChange={(e) => onUpdateConfig({
                    ...config,
                    enableAuditHash: e.target.checked,
                  })}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Menyematkan nomor urut rantai (Sequence #) dan hash anti-manipulasi pada setiap struk yang dicetak untuk kepatuhan audit kasir.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Scissors className="w-3.5 h-3.5 text-slate-400" />
            <span>Garis potong otomatis dipasang di antara setiap slip</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
          >
            Terapkan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
