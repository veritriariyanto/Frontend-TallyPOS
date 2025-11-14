'use client';

import { useEffect, useState } from 'react';
import { categoryApi, Category } from '@/lib/api/products';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiLock, FiUnlock, FiX } from 'react-icons/fi';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchTerm, statusFilter]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Gagal memuat data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = [...categories];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((c) => c.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((c) => !c.isActive);
    }

    setFilteredCategories(filtered);
  };

  const handleOpenModal = (mode: 'create' | 'edit', category?: Category) => {
    setModalMode(mode);
    if (mode === 'edit' && category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        await categoryApi.create(formData);
        toast.success('Kategori berhasil ditambahkan');
      } else if (selectedCategory) {
        await categoryApi.update(selectedCategory.id, formData);
        toast.success('Kategori berhasil diupdate');
      }
      fetchCategories();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan kategori');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${name}"?\n\nPeringatan: Produk dalam kategori ini mungkin akan terpengaruh.`)) {
      return;
    }

    try {
      await categoryApi.delete(id);
      toast.success('Kategori berhasil dihapus');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus kategori');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await categoryApi.toggleActive(id);
      toast.success(`Kategori berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchCategories();
    } catch (error: any) {
      console.error('Error toggling category status:', error);
      toast.error('Gagal mengubah status kategori');
    }
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
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Manajemen Kategori</h2>
          <button
            onClick={() => handleOpenModal('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Tambah Kategori</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Kategori
            </label>
            <input
              type="text"
              placeholder="Nama atau deskripsi kategori..."
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
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Kategori</p>
            <p className="text-2xl font-bold text-gray-900">{filteredCategories.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Kategori Aktif</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredCategories.filter((c) => c.isActive).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Kategori Nonaktif</p>
            <p className="text-2xl font-bold text-gray-600">
              {filteredCategories.filter((c) => !c.isActive).length}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏷️</div>
            <p className="text-gray-500 text-lg">
              {searchTerm || statusFilter !== 'all'
                ? 'Tidak ada kategori yang sesuai dengan filter'
                : 'Belum ada kategori. Klik tombol "Tambah Kategori" untuk menambahkan.'}
            </p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-2">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuat:</span>
                    <span className="text-gray-900 font-medium">{formatDate(category.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diupdate:</span>
                    <span className="text-gray-900 font-medium">{formatDate(category.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  onClick={() => handleOpenModal('edit', category)}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition duration-150 flex items-center space-x-2"
                  title="Edit"
                >
                  <FiEdit2 className="text-base" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleToggleActive(category.id, category.isActive)}
                  className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition duration-150 flex items-center space-x-2"
                  title={category.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {category.isActive ? <FiLock className="text-base" /> : <FiUnlock className="text-base" />}
                  <span>{category.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition duration-150 flex items-center space-x-2"
                  title="Hapus"
                >
                  <FiTrash2 className="text-base" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-xl font-semibold text-gray-900">
                {modalMode === 'create' ? 'Tambah Kategori Baru' : 'Edit Kategori'}
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
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Makanan"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Deskripsi kategori (opsional)"
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
                  {modalMode === 'create' ? 'Tambah Kategori' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
