'use client';

import { useEffect, useState } from 'react';
import { customerApi, Customer, CustomerCreateDto, CustomerUpdateDto } from '@/lib/api/customers';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<CustomerCreateDto>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerApi.getAll();
      setCustomers(data);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Gagal memuat data customer');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleOpenModal = (mode: 'create' | 'edit', customer?: Customer) => {
    setModalMode(mode);
    if (mode === 'edit' && customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        await customerApi.create(formData);
        toast.success('Customer berhasil ditambahkan');
      } else if (selectedCustomer) {
        await customerApi.update(selectedCustomer.id, formData as CustomerUpdateDto);
        toast.success('Customer berhasil diupdate');
      }
      fetchCustomers();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan customer');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus customer "${name}"?`)) {
      return;
    }

    try {
      await customerApi.delete(id);
      toast.success('Customer berhasil dihapus');
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus customer');
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
      {/* Header & Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Manajemen Customer</h2>
          <button
            onClick={() => handleOpenModal('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Tambah Customer</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cari Customer
          </label>
          <input
            type="text"
            placeholder="Nama, phone, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Customer</p>
            <p className="text-2xl font-bold text-gray-900">{filteredCustomers.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Transaksi</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredCustomers.reduce((sum, c) => sum + c.totalTransactions, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Pembelian</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(
                filteredCustomers.reduce((sum, c) => sum + parseFloat(c.totalSpent), 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontak
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alamat
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Transaksi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Belanja
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member Sejak
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm
                      ? 'Tidak ada customer yang sesuai dengan pencarian'
                      : 'Belum ada customer. Klik tombol "Tambah Customer" untuk menambahkan.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-semibold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                          {customer.totalTransactions > 0 && (
                            <p className="text-xs text-gray-500">
                              {customer.totalTransactions > 10 ? '⭐ VIP Customer' : '👤 Member'}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 font-medium">{customer.phone}</p>
                      {customer.email && (
                        <p className="text-xs text-gray-500">{customer.email}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {customer.address || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.totalTransactions}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal('edit', customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition duration-150"
                          title="Edit"
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition duration-150"
                          title="Hapus"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-xl font-semibold text-gray-900">
                {modalMode === 'create' ? 'Tambah Customer Baru' : 'Edit Customer'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: John Doe"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="081234567890"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com (opsional)"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Alamat lengkap customer (opsional)"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150"
                >
                  {modalMode === 'create' ? 'Tambah Customer' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
