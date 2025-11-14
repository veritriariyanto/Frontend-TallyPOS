'use client';

import { useEffect, useState } from 'react';
import { reportApi, SalesReport, TopSellingProduct } from '@/lib/api/reports';
import { transactionApi, TransactionFull } from '@/lib/api/transactions';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiDollarSign, FiTag, FiTrendingUp, FiAward, FiPrinter, FiDownload } from 'react-icons/fi';

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [transactions, setTransactions] = useState<TransactionFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default date to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const [report, products, transData] = await Promise.all([
        reportApi.getSalesReport(startDate, endDate),
        reportApi.getTopSellingProducts(10),
        transactionApi.getAll({ startDate, endDate }),
      ]);

      setSalesReport(report);
      setTopProducts(products);
      setTransactions(transData);
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFilter = (period: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date();
    let start = new Date();
    
    switch (period) {
      case 'today':
        start = today;
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAverageTransaction = () => {
    if (!salesReport || salesReport.totalTransactions === 0) return 0;
    return parseFloat(salesReport.totalRevenue) / salesReport.totalTransactions;
  };

  const getPaymentMethodStats = () => {
    const stats: { [key: string]: number } = {};
    transactions.forEach((t) => {
      stats[t.paymentMethod] = (stats[t.paymentMethod] || 0) + 1;
    });
    return stats;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Simple CSV export
    const csv = [
      ['Laporan Penjualan'],
      [`Periode: ${startDate} s/d ${endDate}`],
      [''],
      ['Ringkasan'],
      ['Total Transaksi', salesReport?.totalTransactions || 0],
      ['Total Pendapatan', salesReport?.totalRevenue || 0],
      ['Total Diskon', salesReport?.totalDiscount || 0],
      ['Total Profit', salesReport?.totalProfit || 0],
      [''],
      ['Produk Terlaris'],
      ['Produk', 'Jumlah Terjual', 'Total Pendapatan', 'Jumlah Transaksi'],
      ...topProducts.map(p => [p.productName, p.totalQuantity, p.totalRevenue, p.transactionCount]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${startDate}-${endDate}.csv`;
    a.click();
    toast.success('Laporan berhasil diexport');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  const paymentStats = getPaymentMethodStats();

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-6 print:shadow-none">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Laporan Penjualan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Periode: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
            </p>
          </div>
          <div className="flex space-x-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-150 flex items-center space-x-2"
            >
              <FiPrinter className="text-lg" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150 flex items-center space-x-2"
            >
              <FiDownload className="text-lg" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Filter
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => handleQuickFilter('today')}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150"
              >
                Hari Ini
              </button>
              <button
                onClick={() => handleQuickFilter('week')}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150"
              >
                7 Hari
              </button>
              <button
                onClick={() => handleQuickFilter('month')}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150"
              >
                Bulan Ini
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {salesReport?.totalTransactions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiShoppingCart className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pendapatan</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(salesReport?.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiDollarSign className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Diskon</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(salesReport?.totalDiscount || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiTag className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {formatCurrency(salesReport?.totalProfit || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rata-rata Transaksi</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(calculateAverageTransaction())}
          </p>
          <p className="text-sm text-gray-600 mt-2">Per transaksi</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Metode Pembayaran</h3>
          <div className="space-y-2">
            {Object.entries(paymentStats).map(([method, count]) => (
              <div key={method} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">
                  {method === 'cash' ? 'Tunai' : method === 'qris' ? 'QRIS' : method === 'debit' ? 'Debit' : method === 'credit' ? 'Kredit' : 'Transfer'}
                </span>
                <span className="text-sm font-semibold text-gray-900">{count}x</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performa</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Margin Profit</p>
              <p className="text-xl font-bold text-green-600">
                {salesReport && parseFloat(salesReport.totalRevenue) > 0
                  ? ((parseFloat(salesReport.totalProfit) / parseFloat(salesReport.totalRevenue)) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata Diskon</p>
              <p className="text-xl font-bold text-orange-600">
                {salesReport && salesReport.totalTransactions > 0
                  ? formatCurrency(parseFloat(salesReport.totalDiscount) / salesReport.totalTransactions)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top 10 Produk Terlaris</h3>
          <p className="text-sm text-gray-600 mt-1">Produk dengan penjualan terbanyak</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty Terjual
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Pendapatan
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah Transaksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data penjualan dalam periode ini
                  </td>
                </tr>
              ) : (
                topProducts.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-100' : 'bg-blue-50'
                        }`}>
                          {index < 3 ? (
                            <FiAward className={`text-lg ${
                              index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                            }`} />
                          ) : (
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">{product.totalQuantity}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(product.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.transactionCount}x
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaksi Dalam Periode</h3>
          <p className="text-sm text-gray-600 mt-1">Daftar semua transaksi ({transactions.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kode Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kasir
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada transaksi dalam periode ini
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-medium text-gray-900">
                        {transaction.transactionCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.customer?.name || 'Walk-in'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(transaction.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status === 'completed' ? 'Selesai' : 
                         transaction.status === 'cancelled' ? 'Dibatalkan' : 'Dikembalikan'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {transactions.length > 20 && (
            <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-600">
              Menampilkan 20 dari {transactions.length} transaksi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
