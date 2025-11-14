'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { transactionApi, TransactionFull } from '@/lib/api/transactions';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiLogOut, FiShoppingCart, FiDollarSign, FiTrendingUp, FiX, FiFileText } from 'react-icons/fi';

export default function RiwayatKasirPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionFull[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionFull | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterDate, setFilterDate] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Proteksi: Kasir dan Admin bisa akses halaman ini
  useEffect(() => {
    if (!isLoading && user && user.role !== 'kasir' && user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filterDate, customStartDate, customEndDate]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setIsLoadingTransactions(true);
    try {
      let params: any = {
        userId: user.sub, // Filter by current user ID
      };

      // Set date filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterDate === 'today') {
        params.startDate = today.toISOString();
      } else if (filterDate === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (filterDate === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString();
      } else if (filterDate === 'custom' && customStartDate) {
        params.startDate = new Date(customStartDate).toISOString();
        if (customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          params.endDate = endDate.toISOString();
        }
      }

      const data = await transactionApi.getAll(params);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat riwayat transaksi');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleViewDetail = async (transaction: TransactionFull) => {
    try {
      const fullTransaction = await transactionApi.getById(transaction.id);
      setSelectedTransaction(fullTransaction);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      toast.error('Gagal memuat detail transaksi');
    }
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
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: '💵 Tunai',
      debit: '💳 Debit',
      credit: '💳 Kredit',
      qris: '📱 QRIS',
      transfer: '🏦 Transfer',
    };
    return labels[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-yellow-100 text-yellow-800',
    };
    const labels: Record<string, string> = {
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      refunded: 'Dikembalikan',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const calculateTotalSales = () => {
    return transactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0);
  };

  const calculateTotalTransactions = () => {
    return transactions.filter((t) => t.status === 'completed').length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/kasir')}
                className="text-white hover:text-blue-100 transition duration-150"
              >
                <FiArrowLeft className="text-2xl" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <FiFileText className="text-3xl" />
                  <span>Riwayat Transaksi</span>
                </h1>
                <p className="text-sm text-blue-100">Kasir: {user?.username}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition duration-150 font-medium flex items-center space-x-2"
            >
              <FiLogOut className="text-lg" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                <p className="text-3xl font-bold text-gray-900">{calculateTotalTransactions()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiShoppingCart className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Penjualan</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalSales())}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiDollarSign className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rata-rata Transaksi</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculateTotalTransactions() > 0 ? calculateTotalSales() / calculateTotalTransactions() : 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FiTrendingUp className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Periode
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">30 Hari Terakhir</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {filterDate === 'custom' && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dari Tanggal
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <button
              onClick={fetchTransactions}
              disabled={isLoadingTransactions}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 font-medium disabled:opacity-50"
            >
              {isLoadingTransactions ? 'Memuat...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                    Pembayaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Memuat transaksi...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-4xl mb-2">📭</div>
                      <p>Belum ada transaksi</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{transaction.transactionCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(transaction.transactionDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.customer ? transaction.customer.name : 'Walk-in Customer'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(transaction.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetail(transaction)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Detail Transaksi</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Kode Transaksi</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedTransaction.transactionCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedTransaction.transactionDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Metode Pembayaran</p>
                  <p className="text-sm text-gray-900">{getPaymentMethodLabel(selectedTransaction.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="text-sm text-gray-900">
                    {selectedTransaction.customer ? (
                      <>
                        {selectedTransaction.customer.name}
                        <br />
                        <span className="text-xs text-gray-500">{selectedTransaction.customer.phone}</span>
                      </>
                    ) : (
                      'Walk-in Customer'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kasir</p>
                  <p className="text-sm text-gray-900">{selectedTransaction.user.fullName}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Item Produk</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produk</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Harga</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Diskon</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedTransaction.details.map((detail) => (
                        <tr key={detail.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{detail.productName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(detail.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{detail.quantity}</td>
                          <td className="px-4 py-3 text-sm text-red-600 text-right">
                            {parseFloat(detail.discountAmount) > 0 ? `-${formatCurrency(detail.discountAmount)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                            {formatCurrency(detail.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                {parseFloat(selectedTransaction.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon Total</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(selectedTransaction.discountAmount)}</span>
                  </div>
                )}
                {parseFloat(selectedTransaction.taxAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pajak</span>
                    <span className="font-semibold">{formatCurrency(selectedTransaction.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(selectedTransaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-600">Dibayar</span>
                  <span className="font-semibold">{formatCurrency(selectedTransaction.paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kembalian</span>
                  <span className="font-semibold text-green-600">{formatCurrency(selectedTransaction.changeAmount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Catatan</p>
                  <p className="text-sm text-gray-900 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    {selectedTransaction.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
