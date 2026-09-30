/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Receipt, ReceiptChainConfig } from '../types';
import { formatCurrency, formatDateTime } from '../utils';
import { 
  Scissors, 
  Utensils, 
  FileCheck2, 
  Truck, 
  CheckSquare, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  ShieldCheck,
  Hash
} from 'lucide-react';

interface ChainedSlipsRendererProps {
  receipt: Receipt;
  currencySymbol: string;
  config: ReceiptChainConfig;
  activeFilter?: 'ALL' | 'KITCHEN' | 'MERCHANT' | 'DELIVERY';
}

export function PerforationDivider({ label }: { label: string }) {
  return (
    <div className="chained-tear-line my-5 select-none print:my-6 print:break-before-page">
      <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono tracking-wider uppercase py-1 px-1 border-y-2 border-dashed border-slate-350 bg-slate-50/60">
        <span className="flex items-center gap-1 font-bold">
          <Scissors className="w-3 h-3 text-slate-700" />
          - - POTONG DI SINI / CUT HERE - -
        </span>
        <span className="font-extrabold text-slate-800">
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Slip 2: Tiket Dapur / Bar (Kitchen & Bar Order Ticket)
 */
export function KitchenSlip({
  receipt,
  config,
}: {
  receipt: Receipt;
  config: ReceiptChainConfig;
}) {
  const totalItemQty = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="kitchen-slip text-black font-mono select-none" id="slip-kitchen">
      {/* Header slip */}
      <div className="text-center pb-2 border-b-2 border-dashed border-black">
        <span className="text-[10px] font-extrabold uppercase tracking-wider block bg-black text-white px-2 py-0.5 rounded-sm mx-auto mb-1 max-w-[200px]">
          TIKET DAPUR / BAR
        </span>
        <div className="text-xs font-bold uppercase truncate">{receipt.storeName}</div>
      </div>

      {/* Table & Order Info Header */}
      <div className="py-2 border-b border-black text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="font-bold text-xs">
            {config.orderType === 'TAKE_AWAY' 
              ? '🥡 TAKE AWAY (BUNGKUS)' 
              : config.orderType === 'DELIVERY' 
                ? '🛵 PESANAN DELIVERY' 
                : '🍽️ DINE IN (DI TEMPAT)'}
          </span>
          {config.tableNumber && (
            <span className="text-sm font-black bg-black text-white px-2 py-0.5 rounded-xs">
              {config.tableNumber}
            </span>
          )}
        </div>

        <div className="flex justify-between text-[10px] text-slate-700 pt-0.5">
          <span>No. Order: <strong>{receipt.transactionId}</strong></span>
          <span>{receipt.dateTime ? receipt.dateTime.split('T')[1] || receipt.dateTime : ''}</span>
        </div>

        {receipt.customerName && (
          <div className="text-[10px] text-slate-800">
            Pelanggan: <strong className="uppercase">{receipt.customerName}</strong>
          </div>
        )}
      </div>

      {/* Item Checklist for Kitchen */}
      <div className="py-2.5">
        <div className="text-[10px] font-bold uppercase pb-1 mb-1.5 border-b border-dotted border-black flex justify-between">
          <span>ITEM PESANAN ({totalItemQty} PORSI)</span>
          <span>CEKLIS</span>
        </div>

        <div className="space-y-2">
          {receipt.items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start justify-between gap-2 text-xs">
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5 font-bold">
                  <span className="text-sm font-black">{item.quantity}x</span>
                  <span className="uppercase text-slate-900 leading-snug">{item.name}</span>
                </div>
              </div>
              <div className="w-4 h-4 border-2 border-black rounded-xs shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Special Kitchen Notes */}
      {config.kitchenNotes && (
        <div className="my-2 p-1.5 bg-slate-100 border border-black rounded-xs text-[10px]">
          <span className="font-black block uppercase mb-0.5">⚠️ Catatan Dapur:</span>
          <span className="italic font-bold text-slate-900">{config.kitchenNotes}</span>
        </div>
      )}

      {/* Footer Kitchen */}
      <div className="text-center text-[9px] text-slate-600 pt-2 border-t-2 border-dashed border-black mt-2 uppercase">
        * Pastikan pesanan siap saji & ceklis sebelum diantar *
      </div>
    </div>
  );
}

/**
 * Slip 3: Salinan Kasir / Toko (Merchant / Accounting Copy)
 */
export function MerchantSlip({
  receipt,
  currencySymbol,
  config,
}: {
  receipt: Receipt;
  currencySymbol: string;
  config: ReceiptChainConfig;
}) {
  const totalItemCount = receipt.items.length;
  const totalItemQty = receipt.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="merchant-slip text-black font-mono select-none" id="slip-merchant">
      {/* Header slip */}
      <div className="text-center pb-2 border-b-2 border-dashed border-black">
        <span className="text-[10px] font-extrabold uppercase tracking-wider block bg-black text-white px-2 py-0.5 rounded-sm mx-auto mb-1 max-w-[220px]">
          SALINAN KASIR & TOKO (AUDIT)
        </span>
        <div className="text-xs font-bold uppercase truncate">{receipt.storeName}</div>
        <div className="text-[9px] text-slate-600 truncate">{receipt.storeAddress}</div>
      </div>

      {/* Transaction Details */}
      <div className="py-2 border-b border-black text-[10px] space-y-1">
        <div className="flex justify-between">
          <span>No. Transaksi:</span>
          <span className="font-bold">{receipt.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu:</span>
          <span>{receipt.dateTime}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir:</span>
          <span className="font-bold uppercase">{receipt.cashierName}</span>
        </div>
        {receipt.customerName && (
          <div className="flex justify-between">
            <span>Pelanggan:</span>
            <span className="uppercase">{receipt.customerName}</span>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="py-2 text-[10.5px] space-y-1">
        <div className="flex justify-between">
          <span>Total Barang:</span>
          <span>{totalItemCount} macam ({totalItemQty} unit)</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(receipt.subtotal, currencySymbol)}</span>
        </div>
        {receipt.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Diskon:</span>
            <span>-{formatCurrency(receipt.discountAmount, currencySymbol)}</span>
          </div>
        )}
        {receipt.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Pajak ({receipt.taxRate}%):</span>
            <span>{formatCurrency(receipt.taxAmount, currencySymbol)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black border-t-2 border-black pt-1">
          <span>TOTAL AKHIR:</span>
          <span>{formatCurrency(receipt.total, currencySymbol)}</span>
        </div>
        <div className="flex justify-between text-[10px] font-bold pt-0.5">
          <span>Metode Bayar:</span>
          <span className="uppercase">{receipt.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-[10px] font-bold">
          <span>Status:</span>
          <span className="uppercase">{receipt.paymentStatus === 'SUDAH_LUNAS' ? 'LUNAS' : receipt.paymentStatus}</span>
        </div>
      </div>

      {/* Cryptographic chain info if enabled */}
      {config.enableAuditHash && (
        <div className="my-2 p-1.5 bg-slate-50 border border-dashed border-slate-400 text-[8.5px] space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>RANTAI TRANSAKSI:</span>
            <span>#{String(config.chainSequence || 1).padStart(4, '0')}</span>
          </div>
          {config.chainHash && (
            <div className="truncate text-slate-600">
              HASH: <span className="font-mono">{config.chainHash}</span>
            </div>
          )}
        </div>
      )}

      {/* Signature boxes */}
      <div className="pt-3 pb-1 border-t border-black text-[9px] text-center">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block mb-7 text-slate-600">Tanda Tangan Kasir</span>
            <span className="border-t border-dotted border-black px-4 pt-0.5 font-bold block truncate">
              {receipt.cashierName}
            </span>
          </div>
          <div>
            <span className="block mb-7 text-slate-600">Konsumen / Otorisasi</span>
            <span className="border-t border-dotted border-black px-4 pt-0.5 block">
              (....................)
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] text-slate-600 pt-2 border-t-2 border-dashed border-black mt-2 uppercase">
        * Lembar arsip keuangan & audit toko *
      </div>
    </div>
  );
}

/**
 * Slip 4: Surat Jalan & Resi Pengambilan (Delivery / Pickup Slip)
 */
export function DeliverySlip({
  receipt,
}: {
  receipt: Receipt;
}) {
  return (
    <div className="delivery-slip text-black font-mono select-none" id="slip-delivery">
      {/* Header slip */}
      <div className="text-center pb-2 border-b-2 border-dashed border-black">
        <span className="text-[10px] font-extrabold uppercase tracking-wider block bg-black text-white px-2 py-0.5 rounded-sm mx-auto mb-1 max-w-[240px]">
          SURAT JALAN & PENGAMBILAN
        </span>
        <div className="text-xs font-bold uppercase truncate">{receipt.storeName}</div>
        <div className="text-[9px] text-slate-600 truncate">{receipt.storePhone}</div>
      </div>

      {/* Recipient Details */}
      <div className="py-2 border-b border-black text-[10px] space-y-1">
        <div className="flex justify-between">
          <span>No. Resi/Order:</span>
          <span className="font-bold">{receipt.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl Kirim/Ambil:</span>
          <span>{receipt.dateTime}</span>
        </div>
        <div className="pt-1 border-t border-dotted border-slate-300">
          <span className="font-bold block">Penerima Barang:</span>
          <span className="uppercase text-xs font-black block">
            {receipt.customerName || 'Pelanggan Umum'}
          </span>
        </div>
      </div>

      {/* Goods Checklist */}
      <div className="py-2.5">
        <div className="text-[10px] font-bold uppercase pb-1 mb-1.5 border-b border-dotted border-black flex justify-between">
          <span>BARANG YANG DISERAHKAN</span>
          <span>KONDISI</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          {receipt.items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="font-black mr-1">{item.quantity}x</span>
                <span className="uppercase">{item.name}</span>
              </div>
              <span className="text-[9px] font-bold border border-black px-1 rounded-xs shrink-0">
                [✓] BAIK
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Handover Signatures */}
      <div className="pt-3 pb-1 border-t border-black text-[9px] text-center">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="block mb-7 text-slate-600">Petugas Pengirim</span>
            <span className="border-t border-dotted border-black px-4 pt-0.5 block">
              (....................)
            </span>
          </div>
          <div>
            <span className="block mb-7 text-slate-600">Penerima Paket</span>
            <span className="border-t border-dotted border-black px-4 pt-0.5 block truncate">
              {receipt.customerName || '(....................)'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[9px] text-slate-600 pt-2 border-t-2 border-dashed border-black mt-2 uppercase">
        * Bukti sah serah terima barang pesanan *
      </div>
    </div>
  );
}

/**
 * Main chained slips container
 */
export default function ChainedSlipsRenderer({
  receipt,
  currencySymbol,
  config,
  activeFilter = 'ALL',
}: ChainedSlipsRendererProps) {
  if (!config.enabled) return null;

  const showKitchen = config.slips.kitchen && (activeFilter === 'ALL' || activeFilter === 'KITCHEN');
  const showMerchant = config.slips.merchant && (activeFilter === 'ALL' || activeFilter === 'MERCHANT');
  const showDelivery = config.slips.delivery && (activeFilter === 'ALL' || activeFilter === 'DELIVERY');

  return (
    <div className="chained-slips-container flex flex-col w-full">
      {/* Kitchen slip if active */}
      {showKitchen && (
        <>
          <PerforationDivider label="SLIP: TIKET DAPUR / BAR" />
          <KitchenSlip receipt={receipt} config={config} />
        </>
      )}

      {/* Merchant copy if active */}
      {showMerchant && (
        <>
          <PerforationDivider label="SLIP: SALINAN TOKO / ARSIP" />
          <MerchantSlip receipt={receipt} currencySymbol={currencySymbol} config={config} />
        </>
      )}

      {/* Delivery slip if active */}
      {showDelivery && (
        <>
          <PerforationDivider label="SLIP: SURAT JALAN & PENGANTARAN" />
          <DeliverySlip receipt={receipt} />
        </>
      )}
    </div>
  );
}
