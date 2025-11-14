'use client';

import { useEffect, useState } from 'react';
import { transactionApi, TransactionFull } from '@/lib/api/transactions';
import toast from 'react-hot-toast';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionFull[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionFull | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter, dateFilter]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionApi.getAll();
      setTransactions(data);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(
        (t) => new Date(t.transactionDate) >= new Date(dateFilter.startDate)
      );
    }
    if (dateFilter.endDate) {
      filtered = filtered.filter(
        (t) => new Date(t.transactionDate) <= new Date(dateFilter.endDate)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleViewDetail = async (transaction: TransactionFull) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleCancelTransaction = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan transaksi ini?')) {
      return;
    }

    try {
      await transactionApi.cancel(id);
      toast.success('Transaksi berhasil dibatalkan');
      fetchTransactions();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Error cancelling transaction:', error);
      toast.error(error.response?.data?.message || 'Gagal membatalkan transaksi');
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-yellow-100 text-yellow-800',
    };
    const labels = {
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      refunded: 'Dikembalikan',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Tunai',
      debit: 'Debit',
      credit: 'Kredit',
      qris: 'QRIS',
      transfer: 'Transfer',
    };
    return labels[method as keyof typeof labels] || method;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Transaksi
            </label>
            <input
              type="text"
              placeholder="Kode transaksi, customer, atau kasir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="refunded">Dikembalikan</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, startDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Pendapatan</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                filteredTransactions.reduce(
                  (sum, t) => sum + parseFloat(t.totalAmount),
                  0
                )
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Diskon</p>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(
                filteredTransactions.reduce(
                  (sum, t) => sum + parseFloat(t.discountAmount),
                  0
                )
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' || dateFilter.startDate
                      ? 'Tidak ada transaksi yang sesuai dengan filter'
                      : 'Belum ada transaksi'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetail(transaction)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
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

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Detail Transaksi
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Kode Transaksi</p>
                  <p className="font-mono font-semibold text-gray-900">
                    {selectedTransaction.transactionCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal & Waktu</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedTransaction.transactionDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">
                    {selectedTransaction.customer?.name || 'Walk-in Customer'}
                  </p>
                  {selectedTransaction.customer?.phone && (
                    <p className="text-sm text-gray-500">{selectedTransaction.customer.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kasir</p>
                  <p className="font-medium text-gray-900">
                    {selectedTransaction.user.fullName}
                  </p>
                  <p className="text-sm text-gray-500">@{selectedTransaction.user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Metode Pembayaran</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {getPaymentMethodLabel(selectedTransaction.paymentMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detail Produk</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produk</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Harga</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Diskon</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTransaction.details.map((detail) => (
                        <tr key={detail.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{detail.productName}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {formatCurrency(detail.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">
                            {detail.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-600">
                            {formatCurrency(detail.discountAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(detail.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Diskon</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(selectedTransaction.discountAmount)}
                    </span>
                  </div>
                  {parseFloat(selectedTransaction.taxAmount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pajak</span>
                      <span className="font-medium">{formatCurrency(selectedTransaction.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span>Total</span>
                    <span className="text-green-600">{formatCurrency(selectedTransaction.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Bayar</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.paymentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kembalian</span>
                    <span className="font-medium">{formatCurrency(selectedTransaction.changeAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Catatan:</p>
                  <p className="text-sm text-gray-900">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between">
              <div>
                {selectedTransaction.status === 'completed' && (
                  <button
                    onClick={() => handleCancelTransaction(selectedTransaction.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-150"
                  >
                    Batalkan Transaksi
                  </button>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
