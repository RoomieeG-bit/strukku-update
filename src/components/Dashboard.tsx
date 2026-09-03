/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Receipt } from '../types';
import { formatCurrency } from '../utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  ChevronRight, 
  Sparkles, 
  Calendar,
  Layers,
  Award,
  BarChart3,
  CalendarDays
} from 'lucide-react';

interface DashboardProps {
  history: Receipt[];
  currencySymbol: string;
}

export default function Dashboard({ history, currencySymbol }: DashboardProps) {
  const [monthlyMetric, setMonthlyMetric] = useState<'sales' | 'count'>('sales');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  
  // Guard for empty history
  if (history.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]" id="dashboard-empty-panel">
        <TrendingUp className="w-12 h-12 text-slate-200 mb-3 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-600">Belum Ada Analitik</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Simpan beberapa struk belanja terlebih dahulu di tab Generator untuk melihat diagram pendapatan, performa kasir, dan barang terpopuler di sini!
        </p>
      </div>
    );
  }

  // 1. KPI Calculations
  const totalSales = history.reduce((sum, item) => sum + item.total, 0);
  const totalReceipts = history.length;
  const avgTicket = totalSales / totalReceipts;
  
  const totalItemsSold = history.reduce((sum, item) => 
    sum + item.items.reduce((acc, i) => acc + i.quantity, 0), 0
  );

  // 2. Prep Sales Over Time (Chart Data)
  // Group by Date formatted nicely (e.g. DD/MM)
  const salesByDate: { [date: string]: number } = {};
  history.forEach((receipt) => {
    const d = new Date(receipt.dateTime);
    const label = isNaN(d.getTime()) 
      ? 'Default' 
      : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    salesByDate[label] = (salesByDate[label] || 0) + receipt.total;
  });

  // Sort dates nicely
  const chartDataSales = Object.keys(salesByDate).map((date) => ({
    date,
    Sales: salesByDate[date],
  }));

  // 3. Prep Payment Method breakdown (Chart Data)
  const paymentCounts: { [method: string]: number } = {
    CASH: 0,
    QRIS: 0,
    DEBIT: 0,
    CREDIT: 0,
  };
  history.forEach((receipt) => {
    const m = receipt.paymentMethod;
    if (paymentCounts[m] !== undefined) {
      paymentCounts[m] += receipt.total;
    }
  });

  const chartDataPayments = Object.keys(paymentCounts)
    .filter((k) => paymentCounts[k] > 0)
    .map((name) => {
      let displayName = name;
      if (name === 'CASH') displayName = 'Tunai (Cash)';
      return {
        name: displayName,
        value: paymentCounts[name],
      };
    });

  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#d97706'];

  // 4. Prep Best-Selling Items (Leaderboard & Bar Chart)
  const itemQuantities: { [itemName: string]: { qty: number; revenue: number } } = {};
  history.forEach((receipt) => {
    receipt.items.forEach((item) => {
      const existing = itemQuantities[item.name] || { qty: 0, revenue: 0 };
      itemQuantities[item.name] = {
        qty: existing.qty + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity),
      };
    });
  });

  const bestSellers = Object.keys(itemQuantities)
    .map((name) => ({
      name,
      Qty: itemQuantities[name].qty,
      Revenue: itemQuantities[name].revenue,
    }))
    .sort((a, b) => b.Qty - a.Qty)
    .slice(0, 5); // top 5

  // 5. Prep Monthly Sales (Recharts Bar Chart Data)
  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const MONTH_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const monthlyStatsMap: {
    [key: string]: {
      sortKey: string;
      year: number;
      monthIndex: number;
      monthLabel: string;
      fullMonthName: string;
      totalSales: number;
      receiptCount: number;
      itemsCount: number;
      avgPerReceipt: number;
    };
  } = {};

  const availableYearsSet = new Set<number>();

  history.forEach((receipt) => {
    const d = new Date(receipt.dateTime);
    if (isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const m = d.getMonth();
    availableYearsSet.add(y);
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;

    if (!monthlyStatsMap[key]) {
      monthlyStatsMap[key] = {
        sortKey: key,
        year: y,
        monthIndex: m,
        monthLabel: `${MONTH_SHORT[m]} ${y}`,
        fullMonthName: `${MONTH_NAMES[m]} ${y}`,
        totalSales: 0,
        receiptCount: 0,
        itemsCount: 0,
        avgPerReceipt: 0,
      };
    }

    monthlyStatsMap[key].totalSales += receipt.total;
    monthlyStatsMap[key].receiptCount += 1;
    const itemsInReceipt = receipt.items.reduce((acc, i) => acc + i.quantity, 0);
    monthlyStatsMap[key].itemsCount += itemsInReceipt;
  });

  Object.values(monthlyStatsMap).forEach((m) => {
    m.avgPerReceipt = m.receiptCount > 0 ? Math.round(m.totalSales / m.receiptCount) : 0;
  });

  const allMonthlyList = Object.values(monthlyStatsMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const sortedYears = Array.from(availableYearsSet).sort((a, b) => b - a);

  const filteredMonthlyList = selectedYear === 'ALL'
    ? allMonthlyList
    : allMonthlyList.filter((m) => m.year.toString() === selectedYear);

  const peakMonthlySales = filteredMonthlyList.length > 0
    ? Math.max(...filteredMonthlyList.map((m) => m.totalSales))
    : 0;
  const peakMonthlyCount = filteredMonthlyList.length > 0
    ? Math.max(...filteredMonthlyList.map((m) => m.receiptCount))
    : 0;

  const highestSalesMonth = filteredMonthlyList.length > 0
    ? [...filteredMonthlyList].sort((a, b) => b.totalSales - a.totalSales)[0]
    : null;

  const avgMonthlyRevenue = filteredMonthlyList.length > 0
    ? Math.round(filteredMonthlyList.reduce((sum, m) => sum + m.totalSales, 0) / filteredMonthlyList.length)
    : 0;

  const formatCompactNumber = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
    return val.toString();
  };

  const CustomMonthlyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs min-w-[200px]">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-1.5 font-display flex items-center justify-between">
            <span>{data.fullMonthName}</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
              {data.year}
            </span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Penjualan:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatCurrency(data.totalSales, currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Jumlah Transaksi:</span>
              <span className="font-bold text-indigo-300 font-mono">
                {data.receiptCount} struk
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Item Terjual:</span>
              <span className="font-medium text-slate-300 font-mono">
                {data.itemsCount} pcs
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-800">
              <span className="text-slate-400">Rata-rata / Struk:</span>
              <span className="font-semibold text-amber-300 font-mono">
                {formatCurrency(data.avgPerReceipt, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" id="dashboard-panel">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Omset Total</span>
            <span className="text-sm sm:text-base font-mono font-bold text-slate-900 leading-tight">
              {formatCurrency(totalSales, currencySymbol)}
            </span>
          </div>
        </div>

        {/* KPI 2: Ticket Size */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Transaksi</span>
            <span className="text-sm sm:text-base font-mono font-bold text-slate-900 leading-tight">
              {formatCurrency(avgTicket, currencySymbol)}
            </span>
          </div>
        </div>

        {/* KPI 3: Receipts volume */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Struk</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {totalReceipts} Struk
            </span>
          </div>
        </div>

        {/* KPI 4: Items Sold */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Barang Terjual</span>
            <span className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {totalItemsSold} pcs
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Left 2 cols) */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs lg:col-span-2 space-y-4 flex flex-col">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tren Pendapatan Harian</h4>
              <span className="text-xs text-slate-500 font-medium">Akumulasi penjualan harian</span>
            </div>
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value as number, currencySymbol), 'Sales']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="Sales" stroke="#0f172a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment breakdown Pie Chart */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</h4>
              <span className="text-xs text-slate-500 font-medium">Berdasarkan total volume rupiah</span>
            </div>
            <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          {chartDataPayments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">No data</div>
          ) : (
            <div className="h-64 flex flex-col justify-center items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataPayments}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartDataPayments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value as number, currencySymbol), 'Volume']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend custom list */}
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {chartDataPayments.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate flex-1">{entry.name}</span>
                    <span className="font-mono font-bold text-slate-800">{((entry.value / totalSales) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Monthly Sales Bar Chart Section (Recharts) */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs space-y-4" id="monthly-sales-chart-panel">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grafik Penjualan Bulanan</h4>
              <span className="text-xs text-slate-500 font-medium">Akumulasi total omset dan volume transaksi bulanan</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Year selector if multiple years */}
            {sortedYears.length > 1 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                id="select-monthly-year"
              >
                <option value="ALL">Semua Tahun</option>
                {sortedYears.map((yr) => (
                  <option key={yr} value={yr.toString()}>{yr}</option>
                ))}
              </select>
            )}

            {/* Metric Toggle: Omset vs Jumlah Struk */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setMonthlyMetric('sales')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  monthlyMetric === 'sales'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="btn-metric-sales"
              >
                Total Omset ({currencySymbol})
              </button>
              <button
                type="button"
                onClick={() => setMonthlyMetric('count')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  monthlyMetric === 'count'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="btn-metric-count"
              >
                Jumlah Struk
              </button>
            </div>
          </div>
        </div>

        {/* Quick Monthly Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bulan Tertinggi</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">
              {highestSalesMonth ? highestSalesMonth.fullMonthName : '-'}
            </span>
            <span className="text-[11px] font-mono text-emerald-600 font-semibold block">
              {highestSalesMonth ? formatCurrency(highestSalesMonth.totalSales, currencySymbol) : '-'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Bulanan</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">
              {formatCurrency(avgMonthlyRevenue, currencySymbol)}
            </span>
            <span className="text-[11px] text-slate-500 block">per bulan aktif</span>
          </div>

          <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-2 sm:pt-0 sm:pl-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Periode Tercatat</span>
            <span className="font-bold text-slate-900 truncate block mt-0.5">
              {filteredMonthlyList.length} Bulan
            </span>
            <span className="text-[11px] text-slate-500 block">
              {filteredMonthlyList.reduce((sum, m) => sum + m.receiptCount, 0)} total transaksi
            </span>
          </div>
        </div>

        {/* Recharts BarChart */}
        {filteredMonthlyList.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">
            Tidak ada data transaksi pada tahun yang dipilih
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredMonthlyList}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => 
                    monthlyMetric === 'sales'
                      ? `${currencySymbol} ${formatCompactNumber(val)}`
                      : `${val}`
                  }
                />
                <Tooltip
                  content={<CustomMonthlyTooltip />}
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                />
                <Bar
                  dataKey={monthlyMetric === 'sales' ? 'totalSales' : 'receiptCount'}
                  name={monthlyMetric === 'sales' ? 'Total Penjualan' : 'Jumlah Struk'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={52}
                >
                  {filteredMonthlyList.map((entry, index) => {
                    const isPeak = monthlyMetric === 'sales'
                      ? entry.totalSales === peakMonthlySales && peakMonthlySales > 0
                      : entry.receiptCount === peakMonthlyCount && peakMonthlyCount > 0;
                    return (
                      <Cell
                        key={`bar-cell-${index}`}
                        fill={isPeak ? '#0f172a' : '#475569'}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart Legend / Guide */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-900 inline-block" />
              <span className="font-medium text-slate-700">Bulan Tertinggi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-600 inline-block" />
              <span className="font-medium text-slate-700">Bulan Reguler</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            Arahkan kursor atau sentuh grafik batang untuk rincian statistik
          </span>
        </div>
      </div>

      {/* Best Sellers & Top Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Products Leaderboard */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produk Terlaris</h4>
                <span className="text-xs text-slate-500 font-medium">Berdasarkan total kuantitas terjual</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {bestSellers.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-slate-50 hover:bg-slate-50/50 rounded-xl transition">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                    idx === 0 
                      ? 'bg-amber-100 text-amber-800' 
                      : idx === 1 
                        ? 'bg-slate-200 text-slate-700' 
                        : idx === 2 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-slate-100 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 text-xs truncate block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Nilai Penjualan: {formatCurrency(item.Revenue, currencySymbol)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 font-mono">{item.Qty} pcs</span>
                  <span className="text-[10px] text-slate-400 block">Terjual</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Quick Tip */}
        <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl flex flex-col justify-between shadow-xs relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
            <TrendingUp className="w-48 h-48" />
          </div>

          <div className="space-y-4">
            <div className="inline-flex p-2.5 bg-slate-800 text-slate-100 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-extrabold text-sm font-display text-white">Rekomendasi Bisnis</h5>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Strukku POS mendeteksi bahwa item terpopuler Anda saat ini adalah <strong className="text-white font-bold">{bestSellers[0]?.name || 'N/A'}</strong>. 
                Pertimbangkan untuk memasangkannya dalam promo bundel menarik untuk meningkatkan volume transaksi bulanan Anda!
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-between items-center mt-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">STRUKKU POS ENGINE</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

      </div>
    </div>
  );
}
