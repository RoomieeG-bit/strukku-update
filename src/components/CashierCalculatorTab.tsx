/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  RotateCcw, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Banknote, 
  Sparkles, 
  Delete, 
  Plus, 
  Minus,
  Layers,
  Percent,
  Divide,
  X as Multiply,
  Equal
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface CashierCalculatorTabProps {
  receiptTotal: number;
  currentCashReceived: number;
  currencySymbol: string;
  onApplyCashPayment: (cashReceived: number) => void;
}

// Indonesian Rupiah standard denominations
const CASH_DENOMINATIONS = [
  { value: 100000, label: '100.000', color: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100', type: 'note' },
  { value: 50000, label: '50.000', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100', type: 'note' },
  { value: 20000, label: '20.000', color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100', type: 'note' },
  { value: 10000, label: '10.000', color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100', type: 'note' },
  { value: 5000, label: '5.000', color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100', type: 'note' },
  { value: 2000, label: '2.000', color: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200', type: 'note' },
  { value: 1000, label: '1.000', color: 'bg-lime-50 border-lime-200 text-lime-800 hover:bg-lime-100', type: 'note' },
  { value: 500, label: '500', color: 'bg-amber-100/70 border-amber-300 text-amber-900 hover:bg-amber-200', type: 'coin' },
  { value: 200, label: '200', color: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200', type: 'coin' },
  { value: 100, label: '100', color: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200', type: 'coin' },
];

export default function CashierCalculatorTab({
  receiptTotal,
  currentCashReceived,
  currencySymbol,
  onApplyCashPayment,
}: CashierCalculatorTabProps) {
  // Bill total (synced with receiptTotal by default, but editable)
  const [billAmount, setBillAmount] = useState<number>(receiptTotal);
  // Cash tendered by customer
  const [cashTendered, setCashTendered] = useState<number>(currentCashReceived > 0 ? currentCashReceived : 0);
  
  // Denomination counts map (e.g. { 100000: 1, 50000: 2 })
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({});
  
  // Feedback message when applied
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  // Sync billAmount when receiptTotal changes if user hasn't explicitly diverged
  useEffect(() => {
    if (billAmount === 0 && receiptTotal > 0) {
      setBillAmount(receiptTotal);
    }
  }, [receiptTotal]);

  // Calculate change
  const changeAmount = cashTendered - billAmount;
  const isExact = cashTendered > 0 && changeAmount === 0;
  const isSurplus = changeAmount > 0;
  const isDeficit = cashTendered > 0 && changeAmount < 0;

  // Add denomination
  const handleAddDenomination = (value: number) => {
    setCashTendered((prev) => prev + value);
    setDenomCounts((prev) => ({
      ...prev,
      [value]: (prev[value] || 0) + 1,
    }));
  };

  // Remove denomination
  const handleRemoveDenomination = (value: number) => {
    const currentCount = denomCounts[value] || 0;
    if (currentCount > 0) {
      setCashTendered((prev) => Math.max(0, prev - value));
      setDenomCounts((prev) => ({
        ...prev,
        [value]: currentCount - 1,
      }));
    }
  };

  // Quick action: Uang Pas
  const handleSetExactCash = () => {
    setCashTendered(billAmount);
    setDenomCounts({});
  };

  // Quick action: Pembulatan ke atas (Round up to nearest 10k, 50k, 100k)
  const handleRoundUp = (step: number) => {
    if (billAmount <= 0) return;
    const rounded = Math.ceil(billAmount / step) * step;
    setCashTendered(rounded === billAmount && step > 0 ? billAmount + step : rounded);
    setDenomCounts({});
  };

  // Reset calculator
  const handleReset = () => {
    setCashTendered(0);
    setDenomCounts({});
    setAppliedFeedback(null);
  };

  // NumPad digit input
  const handleNumpadPress = (val: string) => {
    if (val === 'C') {
      setCashTendered(0);
      setDenomCounts({});
      return;
    }
    if (val === 'BACK') {
      const str = cashTendered.toString();
      if (str.length <= 1) {
        setCashTendered(0);
      } else {
        setCashTendered(parseInt(str.slice(0, -1), 10) || 0);
      }
      return;
    }

    const currentStr = cashTendered === 0 ? '' : cashTendered.toString();
    const newStr = currentStr + val;
    // Cap at 1 billion to avoid overflow
    const num = parseInt(newStr, 10);
    if (!isNaN(num) && num <= 1000000000) {
      setCashTendered(num);
    }
  };

  // Calculate breakdown of change into cash denominations (greedy algorithm)
  const calculateChangeBreakdown = (amount: number) => {
    if (amount <= 0) return [];
    let remaining = amount;
    const breakdown: { value: number; count: number; label: string; type: string }[] = [];

    for (const d of CASH_DENOMINATIONS) {
      if (remaining >= d.value) {
        const count = Math.floor(remaining / d.value);
        breakdown.push({
          value: d.value,
          count,
          label: d.label,
          type: d.type,
        });
        remaining %= d.value;
      }
    }
    return breakdown;
  };

  const changeBreakdown = isSurplus ? calculateChangeBreakdown(changeAmount) : [];

  // Apply to receipt
  const handleApplyToReceipt = () => {
    onApplyCashPayment(cashTendered);
    setAppliedFeedback(`Uang tunai diterima Rp ${cashTendered.toLocaleString('id-ID')} berhasil diterapkan ke pembayaran struk!`);
    setTimeout(() => {
      setAppliedFeedback(null);
    }, 4000);
  };

  return (
    <div className="space-y-4" id="cashier-calculator-panel">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Kalkulator Kasir & Uang Kembalian
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  POS Mini
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Hitung uang kembalian pelanggan secara presisi berdasarkan pecahan uang tunai yang diterima.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            title="Reset perhitungan kalkulator"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Bill & Cash Input Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Total Tagihan (Bill) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Total Tagihan Belanja
              </label>
              {billAmount !== receiptTotal && (
                <button
                  type="button"
                  onClick={() => setBillAmount(receiptTotal)}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
                >
                  Gunakan Total Struk ({currencySymbol} {receiptTotal.toLocaleString('id-ID')})
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">{currencySymbol}</span>
              <input
                type="number"
                min="0"
                value={billAmount || ''}
                onChange={(e) => setBillAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                placeholder="0"
                id="input-calc-bill-amount"
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Struk aktif saat ini:</span>
              <span className="font-mono font-semibold text-slate-700">
                {currencySymbol} {receiptTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Uang Diterima (Cash Tendered) */}
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Uang Diterima dari Pelanggan
              </label>
              <button
                type="button"
                onClick={handleSetExactCash}
                className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 hover:bg-amber-300 transition cursor-pointer"
                title="Isi dengan uang pas sesuai tagihan"
              >
                Uang Pas
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700">{currencySymbol}</span>
              <input
                type="number"
                min="0"
                value={cashTendered || ''}
                onChange={(e) => {
                  setCashTendered(Math.max(0, parseInt(e.target.value, 10) || 0));
                  setDenomCounts({});
                }}
                className="w-full text-lg font-mono font-bold text-slate-900 bg-white border border-amber-300 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none"
                placeholder="0"
                id="input-calc-cash-tendered"
              />
            </div>
            <div className="text-[11px] text-amber-800/80 mt-1 flex items-center justify-between">
              <span>Bisa klik pecahan uang di bawah atau gunakan tombol NumPad.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Card: Kembalian / Pas / Kurang */}
      <div 
        className={`rounded-2xl p-5 border transition-all ${
          isSurplus
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white border-emerald-300 shadow-xs'
            : isExact
            ? 'bg-gradient-to-br from-blue-500/10 via-blue-50 to-white border-blue-300 shadow-xs'
            : isDeficit
            ? 'bg-gradient-to-br from-rose-500/10 via-rose-50 to-white border-rose-300 shadow-xs'
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}
        id="calc-result-box"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-slate-600">
              {isSurplus
                ? 'Uang Kembalian Pelanggan'
                : isExact
                ? 'Status Pembayaran'
                : isDeficit
                ? 'Uang Pembayaran Kurang'
                : 'Status Kembalian'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-mono font-extrabold ${
                isSurplus
                  ? 'text-emerald-700'
                  : isExact
                  ? 'text-blue-700'
                  : isDeficit
                  ? 'text-rose-600'
                  : 'text-slate-400'
              }`}>
                {cashTendered === 0
                  ? `${currencySymbol} 0`
                  : isSurplus
                  ? `${currencySymbol} ${changeAmount.toLocaleString('id-ID')}`
                  : isExact
                  ? 'UANG PAS (Rp 0)'
                  : `- ${currencySymbol} ${Math.abs(changeAmount).toLocaleString('id-ID')}`}
              </span>
              {isSurplus && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kembalian Cukup
                </span>
              )}
              {isExact && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Tidak Ada Kembalian
                </span>
              )}
              {isDeficit && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Kurang {currencySymbol} {Math.abs(changeAmount).toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>

          {/* Quick Apply Button */}
          {cashTendered > 0 && (
            <div className="shrink-0 flex flex-col items-start sm:items-end gap-1">
              <button
                type="button"
                onClick={handleApplyToReceipt}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                id="btn-apply-cash-to-receipt"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Terapkan ke Struk Kasir</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <span className="text-[10px] text-slate-500">
                Otomatis mengisi uang diterima di struk ({currencySymbol} {cashTendered.toLocaleString('id-ID')})
              </span>
            </div>
          )}
        </div>

        {/* Feedback message */}
        {appliedFeedback && (
          <div className="mt-3 p-2 px-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{appliedFeedback}</span>
          </div>
        )}

        {/* Rincian Saran Pecahan Uang Kembalian (Smart Breakdown) */}
        {isSurplus && changeBreakdown.length > 0 && (
          <div className="mt-4 pt-3 border-t border-emerald-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Saran Pecahan Uang Kembalian (Ambil dari Laci Kasir):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {changeBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                >
                  {item.type === 'note' ? (
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>
                    <strong className="text-emerald-700">{item.count}x</strong> {item.type === 'note' ? 'Lembar' : 'Koin'} {currencySymbol} {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Denominations & NumPad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Pecahan Uang Cepat (Denominations) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-amber-600" />
                Pecahan Uang Tunai (Klik untuk Menambahkan)
              </h4>
              <span className="text-[11px] text-slate-400">Pecahan Rupiah RI</span>
            </div>

            {/* Cash Denominations Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CASH_DENOMINATIONS.map((denom) => {
                const count = denomCounts[denom.value] || 0;
                return (
                  <div
                    key={denom.value}
                    className={`border rounded-xl p-2.5 transition flex flex-col justify-between relative group ${denom.color}`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        {denom.type === 'note' ? 'Uang Kertas' : 'Koin Logam'}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-white shadow-2xs">
                          {count}x
                        </span>
                      )}
                    </div>
                    <div className="my-1">
                      <div className="font-mono font-extrabold text-sm sm:text-base">
                        {currencySymbol} {denom.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pt-1 border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => handleAddDenomination(denom.value)}
                        className="flex-1 py-1 px-1 bg-white hover:bg-slate-50 text-slate-800 rounded-md text-[11px] font-bold flex items-center justify-center gap-0.5 border border-slate-200/80 shadow-2xs cursor-pointer transition active:scale-95"
                        title={`Tambah 1 lembar ${currencySymbol} ${denom.label}`}
                      >
                        <Plus className="w-3 h-3" /> Tambah
                      </button>
                      {count > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDenomination(denom.value)}
                          className="py-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[11px] font-bold border border-rose-200 cursor-pointer transition"
                          title={`Kurangi 1 lembar ${currencySymbol} ${denom.label}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Rounding Helpers (Pembulatan ke Atas) */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Trik Kasir: Pembulatan Cepat ke Lembaran Atas
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRoundUp(10000)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Bulatkan ke 10.000
              </button>
              <button
                type="button"
                onClick={() => handleRoundUp(50000)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-blue-500" />
                Bulatkan ke 50.000
              </button>
              <button
                type="button"
                onClick={() => handleRoundUp(100000)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer border border-slate-200 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-rose-500" />
                Bulatkan ke 100.000
              </button>
              <button
                type="button"
                onClick={handleSetExactCash}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition cursor-pointer border border-amber-200 flex items-center gap-1"
              >
                <Check className="w-3 h-3 text-amber-700" />
                Set Uang Pas
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Mini NumPad Kasir */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-slate-600" />
                NumPad Kasir
              </h4>
              <span className="text-[11px] font-mono text-slate-500">
                Uang: {currencySymbol} {cashTendered.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Calculator screen */}
            <div className="bg-slate-900 text-white rounded-xl p-3 mb-3 text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">Input Uang Diterima</div>
              <div className="text-2xl font-bold text-amber-400 truncate">
                {currencySymbol} {cashTendered.toLocaleString('id-ID')}
              </div>
            </div>

            {/* NumPad Grid */}
            <div className="grid grid-cols-3 gap-1.5" id="numpad-grid">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '000'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleNumpadPress(digit)}
                  className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg font-mono font-bold text-base transition cursor-pointer border border-slate-200 active:scale-95 shadow-2xs"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* Action buttons (Clear & Backspace) */}
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => handleNumpadPress('BACK')}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
                title="Hapus digit terakhir"
              >
                <Delete className="w-4 h-4" /> Hapus (⌫)
              </button>
              <button
                type="button"
                onClick={() => handleNumpadPress('C')}
                className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer border border-rose-200"
                title="Bersihkan nilai (Clear)"
              >
                Clear (C)
              </button>
            </div>
          </div>

          {/* Quick Apply Footer in NumPad */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleApplyToReceipt}
              disabled={cashTendered === 0}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                cashTendered > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-98'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Uang Ini ke Struk ({currencySymbol} {cashTendered.toLocaleString('id-ID')})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
