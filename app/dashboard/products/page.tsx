'use client';

import { useEffect, useState } from 'react';
import { productApi, categoryApi, Product, Category, ProductCreateDto, ProductUpdateDto } from '@/lib/api/products';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiLock, FiUnlock, FiX } from 'react-icons/fi';
import { getImageUrl } from '@/lib/api/axios';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<ProductCreateDto>({
    categoryId: '',
    sku: '',
    barcode: '',
    name: '',
    description: '',
    purchasePrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStock: 0,
    unit: 'pcs',
    imageUrl: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productApi.getAll(),
        categoryApi.getActive(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.categoryId === categoryFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.isActive);
    } else if (statusFilter === 'low-stock') {
      filtered = filtered.filter((p) => p.stock <= p.minStock);
    }

    setFilteredProducts(filtered);
  };

  const handleOpenModal = (mode: 'create' | 'edit', product?: Product) => {
    setModalMode(mode);
    if (mode === 'edit' && product) {
      setSelectedProduct(product);
      setFormData({
        categoryId: product.categoryId,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        description: product.description || '',
        purchasePrice: parseFloat(product.purchasePrice),
        sellingPrice: parseFloat(product.sellingPrice),
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
        imageUrl: product.imageUrl || '',
      });
      // Set existing image preview
      if (product.imageUrl) {
        setImagePreview(getImageUrl(product.imageUrl));
      }
    } else {
      setSelectedProduct(null);
      setFormData({
        categoryId: '',
        sku: '',
        barcode: '',
        name: '',
        description: '',
        purchasePrice: 0,
        sellingPrice: 0,
        stock: 0,
        minStock: 0,
        unit: 'pcs',
        imageUrl: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error('Format file tidak valid. Gunakan JPG, PNG, GIF, atau WEBP');
        return;
      }
      if (file.size > maxSize) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrl = formData.imageUrl;

      // Upload image if new file selected
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          imageUrl = await productApi.uploadImage(imageFile);
          toast.success('Gambar berhasil diupload');
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Gagal upload gambar, melanjutkan tanpa gambar');
        } finally {
          setIsUploadingImage(false);
        }
      }

      const dataToSubmit = { ...formData, imageUrl };

      if (modalMode === 'create') {
        await productApi.create(dataToSubmit);
        toast.success('Produk berhasil ditambahkan');
      } else if (selectedProduct) {
        await productApi.update(selectedProduct.id, dataToSubmit as ProductUpdateDto);
        toast.success('Produk berhasil diupdate');
      }
      fetchData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
      return;
    }

    try {
      await productApi.delete(id);
      toast.success('Produk berhasil dihapus');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus produk');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await productApi.toggleActive(id);
      toast.success(`Produk berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchData();
    } catch (error: any) {
      console.error('Error toggling product status:', error);
      toast.error('Gagal mengubah status produk');
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
          <h2 className="text-xl font-semibold text-gray-900">Manajemen Produk</h2>
          <button
            onClick={() => handleOpenModal('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Tambah Produk</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Produk
            </label>
            <input
              type="text"
              placeholder="Nama, SKU, atau barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
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
              <option value="low-stock">Stok Rendah</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Produk</p>
            <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Produk Aktif</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredProducts.filter((p) => p.isActive).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Stok Rendah</p>
            <p className="text-2xl font-bold text-red-600">
              {filteredProducts.filter((p) => p.stock <= p.minStock).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Nilai Stok</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                filteredProducts.reduce(
                  (sum, p) => sum + parseFloat(p.sellingPrice) * p.stock,
                  0
                )
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU / Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Beli
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga Jual
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                      ? 'Tidak ada produk yang sesuai dengan filter'
                      : 'Belum ada produk. Klik tombol "Tambah Produk" untuk menambahkan.'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          {getImageUrl(product.imageUrl) ? (
                            <img
                              src={getImageUrl(product.imageUrl)!}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-gray-400 text-xl">📦</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono text-gray-900">{product.sku}</p>
                      <p className="text-xs font-mono text-gray-500">{product.barcode}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900">
                      {formatCurrency(product.purchasePrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-sm font-semibold ${
                            product.stock <= product.minStock
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </span>
                        {product.stock <= product.minStock && (
                          <span className="text-xs text-red-500">Stok rendah!</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal('edit', product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition duration-150"
                          title="Edit"
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(product.id, product.isActive)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition duration-150"
                          title={product.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {product.isActive ? <FiLock className="text-lg" /> : <FiUnlock className="text-lg" />}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {modalMode === 'create' ? 'Tambah Produk Baru' : 'Edit Produk'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Satuan <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pcs">Pcs</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                  </select>
                </div>

                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Indomie Goreng"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PRD-001"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234567890123"
                  />
                </div>

                {/* Purchase Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Beli <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Selling Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Jual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Awal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Min Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok Minimum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Deskripsi produk (opsional)"
                  />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gambar Produk
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        title="Hapus gambar"
                      >
                        <FiX className="text-sm" />
                      </button>
                    </div>
                  )}

                  {/* File Input */}
                  {!imagePreview && (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition text-center">
                        <div className="text-gray-600 mb-2">
                          <span className="text-4xl">📷</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Klik untuk upload gambar
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, WEBP hingga 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150"
                  disabled={isUploadingImage}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading gambar...
                    </>
                  ) : (
                    modalMode === 'create' ? 'Tambah Produk' : 'Simpan Perubahan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
