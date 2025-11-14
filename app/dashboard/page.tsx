'use client';

import { useEffect, useState } from 'react';
import { dashboardApi, DashboardStats, Product, Transaction, Customer } from '@/lib/api/dashboard';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiDollarSign, FiTag, FiTrendingUp } from 'react-icons/fi';


;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      // Fetch all data in parallel, errors are handled individually in each API call
      const [statsData, lowStock, transactions, customers] = await Promise.all([
        dashboardApi.getReport(),
        dashboardApi.getLowStockProducts(),
        dashboardApi.getRecentTransactions(5),
        dashboardApi.getTopCustomers(5),
      ]);

      setStats(statsData);
      setLowStockProducts(lowStock);
      setRecentTransactions(transactions);
      setTopCustomers(customers);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      // Don't show error toast since individual APIs handle their own errors
      // Dashboard will still display with default/empty data
    } finally {
      setIsLoading(false);
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.totalTransactions || 0}
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
                {formatCurrency(stats?.totalRevenue || 0)}
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
                {formatCurrency(stats?.totalDiscount || 0)}
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
                {formatCurrency(stats?.totalProfit || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="text-2xl text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Produk Stok Rendah</h3>
            <p className="text-sm text-gray-600 mt-1">Produk yang perlu di-restock</p>
          </div>
          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Semua produk memiliki stok cukup</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">
                        Stok: {product.stock} {product.unit}
                      </p>
                      <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Transaksi Terbaru</h3>
            <p className="text-sm text-gray-600 mt-1">5 transaksi terakhir</p>
          </div>
          <div className="p-6">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Belum ada transaksi</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{transaction.transactionCode}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.transactionDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(transaction.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{transaction.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900">Top 5 Customer</h3>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">Customer dengan total pembelian terbesar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Belanja
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Belum ada data customer
                  </td>
                </tr>
              ) : (
                topCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.totalTransactions}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
