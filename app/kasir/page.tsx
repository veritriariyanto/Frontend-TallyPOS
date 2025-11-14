'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { productApi, Product } from '@/lib/api/products';
import { getImageUrl } from '@/lib/api/axios';
import { customerApi, Customer } from '@/lib/api/customers';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api/axios';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiFileText, FiPrinter, FiCheckCircle, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { MdLocalOffer, MdPayment } from 'react-icons/md';

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

export default function KasirPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'debit' | 'credit' | 'qris' | 'transfer'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Proteksi: Kasir dan Admin bisa akses halaman ini
  useEffect(() => {
    if (!isLoading && user && user.role !== 'kasir' && user.role !== 'admin') {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const delayTimer = setTimeout(() => {
      fetchProducts(searchProduct);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayTimer);
  }, [searchProduct]);

  const fetchProducts = async (search?: string) => {
    setIsLoadingProducts(true);
    try {
      if (search && search.trim().length > 0) {
        // Search with API
        const data = await productApi.getAll({ search: search.trim(), isActive: true });
        setProducts(data);
      } else {
        // Get all active products
        const data = await productApi.getActive();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Gagal memuat produk');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCustomers = async () => {
    const data = await customerApi.getAll();
    setCustomers(data);
  };

  // Products are already filtered by API search

  // Scan/Search product by barcode or name
  const handleProductSearch = async (searchValue: string) => {
    if (!searchValue || searchValue.trim().length === 0) return;

    setIsLoadingProducts(true);
    try {
      // Try search by barcode first
      const barcodeProduct = await productApi.getByBarcode(searchValue.trim());
      if (barcodeProduct) {
        addToCart(barcodeProduct);
        setSearchProduct('');
        return;
      }
    } catch (error) {
      // If barcode not found, search by name
      try {
        const searchResults = await productApi.getAll({ search: searchValue.trim(), isActive: true });
        if (searchResults.length === 1) {
          addToCart(searchResults[0]);
          setSearchProduct('');
        } else if (searchResults.length > 1) {
          setProducts(searchResults);
        } else {
          toast.error('Produk tidak ditemukan');
        }
      } catch (err) {
        console.error('Error searching product:', err);
        toast.error('Gagal mencari produk');
      }
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    
    if (existingItem) {
      // Check stock
      if (existingItem.quantity >= product.stock) {
        toast.error('Stok tidak mencukupi');
        return;
      }
      updateCartItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      if (product.stock <= 0) {
        toast.error('Produk out of stock');
        return;
      }
      const newItem: CartItem = {
        product,
        quantity: 1,
        discount: 0,
        subtotal: parseFloat(product.sellingPrice),
      };
      setCart([...cart, newItem]);
      toast.success(`${product.name} ditambahkan ke keranjang`);
    }
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast.error('Stok tidak mencukupi');
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: (parseFloat(item.product.sellingPrice) * newQuantity) - item.discount,
            }
          : item
      )
    );
  };

  const updateCartItemDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              discount: discount,
              subtotal: (parseFloat(item.product.sellingPrice) * item.quantity) - discount,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    toast.success('Item dihapus dari keranjang');
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setPaymentAmount(0);
    setNotes('');
    toast.success('Keranjang dikosongkan');
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.product.sellingPrice) * item.quantity, 0);
  };

  const calculateTotalDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateTotalDiscount();
  };

  const calculateChange = () => {
    return paymentAmount - calculateTotal();
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }
    setPaymentAmount(calculateTotal());
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (paymentAmount < calculateTotal()) {
      toast.error('Jumlah pembayaran kurang');
      return;
    }

    try {
      setIsProcessing(true);
      
      const transactionData = {
        customerId: selectedCustomer?.id || null,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discountAmount: item.discount,
        })),
        discountPercentage: 0,
        discountAmount: calculateTotalDiscount(),
        taxAmount: 0,
        paymentMethod,
        paymentAmount,
        notes: notes || null,
      };

      const response = await apiClient.post('/transactions', transactionData);
      
      toast.success('Transaksi berhasil!');
      
      // Save transaction for print
      setLastTransaction(response.data);
      
      // Clear cart and close payment modal
      clearCart();
      setShowPaymentModal(false);
      
      // Show print modal
      setShowPrintModal(true);
      
    } catch (error: any) {
      console.error('Error processing transaction:', error);
      toast.error(error.response?.data?.message || 'Gagal memproses transaksi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !lastTransaction) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk - ${lastTransaction.transactionCode}</title>
        <style>
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .header h2 {
            margin: 0;
            font-size: 18px;
          }
          .header p {
            margin: 2px 0;
            font-size: 10px;
          }
          .info {
            margin-bottom: 10px;
            font-size: 11px;
          }
          .info div {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          th, td {
            padding: 3px 0;
            text-align: left;
          }
          th {
            border-bottom: 1px solid #000;
            font-weight: bold;
          }
          .item-row td {
            border-bottom: 1px dashed #ccc;
          }
          .total-section {
            margin-top: 10px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .total-row.grand {
            font-weight: bold;
            font-size: 14px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 2px dashed #000;
            padding-top: 10px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>TALLY POS</h2>
          <p>Point of Sale System</p>
          <p>Terima Kasih Atas Kunjungan Anda</p>
        </div>
        
        <div class="info">
          <div><span>No. Transaksi</span><span>${lastTransaction.transactionCode}</span></div>
          <div><span>Tanggal</span><span>${new Date(lastTransaction.transactionDate).toLocaleString('id-ID')}</span></div>
          <div><span>Kasir</span><span>${user?.username || ''}</span></div>
          ${lastTransaction.customer ? `<div><span>Customer</span><span>${lastTransaction.customer.name}</span></div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 60%">Item</th>
              <th style="width: 10%; text-align: center">Qty</th>
              <th style="width: 30%; text-align: right">Harga</th>
            </tr>
          </thead>
          <tbody>
            ${lastTransaction.details?.map((item: any) => `
              <tr class="item-row">
                <td>${item.productName}</td>
                <td style="text-align: center">${item.quantity}</td>
                <td style="text-align: right">${formatCurrency(item.subtotal)}</td>
              </tr>
              ${parseFloat(item.discountAmount) > 0 ? `
                <tr>
                  <td colspan="3" style="text-align: right; font-size: 10px; color: #666;">
                    Diskon: -${formatCurrency(item.discountAmount)}
                  </td>
                </tr>
              ` : ''}
            `).join('') || ''}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(lastTransaction.subtotal)}</span>
          </div>
          ${parseFloat(lastTransaction.discountAmount) > 0 ? `
            <div class="total-row">
              <span>Diskon:</span>
              <span>-${formatCurrency(lastTransaction.discountAmount)}</span>
            </div>
          ` : ''}
          <div class="total-row grand">
            <span>TOTAL:</span>
            <span>${formatCurrency(lastTransaction.totalAmount)}</span>
          </div>
          <div class="total-row">
            <span>Bayar (${lastTransaction.paymentMethod.toUpperCase()}):</span>
            <span>${formatCurrency(lastTransaction.paymentAmount)}</span>
          </div>
          <div class="total-row">
            <span>Kembalian:</span>
            <span>${formatCurrency(lastTransaction.changeAmount)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          <p>Simpan struk ini sebagai bukti pembayaran</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
              <FiShoppingCart className="text-3xl text-white" />
              <h1 className="text-2xl font-bold text-white">TallyPOS - Kasir</h1>
              <div className="text-white text-sm">
                <p>Kasir: <span className="font-semibold">{user?.username}</span></p>
                <p className="text-xs opacity-90">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/kasir/riwayat')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition duration-150 font-medium flex items-center space-x-2"
              >
                <FiFileText className="text-lg" />
                <span>Riwayat</span>
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition duration-150 font-medium flex items-center space-x-2"
              >
                <FiLogOut className="text-lg" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Products */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search Product */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Scan barcode atau cari produk (nama/SKU)..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchProduct.trim()) {
                        handleProductSearch(searchProduct);
                      }
                    }}
                    className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => handleProductSearch(searchProduct)}
                  disabled={!searchProduct.trim() || isLoadingProducts}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FiSearch className="text-lg" />
                  <span>{isLoadingProducts ? 'Mencari...' : 'Cari'}</span>
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Produk</h3>
                {isLoadingProducts && (
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Mencari...
                  </div>
                )}
                {!isLoadingProducts && searchProduct && (
                  <span className="text-sm text-gray-600">
                    {products.length} hasil ditemukan
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-350px)] overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition duration-150 text-left"
                    disabled={product.stock <= 0}
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      {getImageUrl(product.imageUrl) ? (
                        <img src={getImageUrl(product.imageUrl)!} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <MdLocalOffer className="text-5xl text-gray-400" />
                      )}
                    </div>
                    <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 truncate">SKU: {product.sku}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(product.sellingPrice)}</p>
                    <p className={`text-xs ${product.stock <= product.minStock ? 'text-red-600' : 'text-gray-500'}`}>
                      Stok: {product.stock} {product.unit}
                    </p>
                  </button>
                ))}
              </div>
              {!isLoadingProducts && products.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-4xl mb-2">🔍</p>
                  <p>{searchProduct ? 'Produk tidak ditemukan' : 'Tidak ada produk'}</p>
                  {searchProduct && (
                    <button
                      onClick={() => setSearchProduct('')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Tampilkan semua produk
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart */}
          <div className="space-y-4">
            {/* Customer Selection */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">CUSTOMER</h3>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Pilih
                </button>
              </div>
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-gray-600">{selectedCustomer.phone}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Walk-in Customer</p>
              )}
            </div>

            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Keranjang ({cart.length})</h3>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 max-h-[350px] overflow-y-auto space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-2">🛒</p>
                    <p className="text-sm">Keranjang kosong</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.product.sellingPrice)} / {item.product.unit}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 bg-white rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                          >
                            <FiMinus className="text-sm" />
                          </button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 bg-white rounded border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
                          >
                            <FiPlus className="text-sm" />
                          </button>
                        </div>
                        <p className="font-bold text-gray-900">{formatCurrency(item.subtotal)}</p>
                      </div>

                      {/* Discount */}
                      <div className="mt-2">
                        <input
                          type="number"
                          placeholder="Diskon (Rp)"
                          value={item.discount || ''}
                          onChange={(e) => updateCartItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {calculateTotalDiscount() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(calculateTotalDiscount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-2">
                    <span>TOTAL</span>
                    <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 font-bold text-lg mt-4 flex items-center justify-center space-x-2"
                  >
                    <MdPayment className="text-2xl" />
                    <span>CHECKOUT & BAYAR</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrintModal && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg text-center">
              <FiCheckCircle className="text-6xl mx-auto mb-2" />
              <h3 className="text-xl font-semibold">Transaksi Berhasil!</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">Kode Transaksi</p>
                <p className="text-2xl font-bold text-gray-900">{lastTransaction.transactionCode}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Pembayaran</span>
                  <span className="font-semibold">{formatCurrency(lastTransaction.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dibayar</span>
                  <span className="font-semibold">{formatCurrency(lastTransaction.paymentAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-green-600">Kembalian</span>
                  <span className="text-green-600">{formatCurrency(lastTransaction.changeAmount)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePrint}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 font-bold flex items-center justify-center space-x-2"
                >
                  <FiPrinter className="text-xl" />
                  <span>CETAK STRUK</span>
                </button>

                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setLastTransaction(null);
                  }}
                  className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150 font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Pilih Customer</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <input
                type="text"
                placeholder="Cari customer..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="space-y-2">
                {customers
                  .filter((c) =>
                    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
                    c.phone.includes(searchCustomer)
                  )
                  .map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowCustomerModal(false);
                        setSearchCustomer('');
                      }}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition duration-150"
                    >
                      <p className="font-semibold text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h3 className="text-xl font-semibold">Pembayaran</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(calculateTotal())}</p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'debit', 'qris'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition duration-150 ${
                        paymentMethod === method
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {method === 'cash' ? '💵 Tunai' : method === 'debit' ? '💳 Debit' : '📱 QRIS'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Bayar
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              {/* Change */}
              {paymentAmount >= calculateTotal() && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Kembalian</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateChange())}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Catatan transaksi..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150"
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                onClick={handleProcessPayment}
                disabled={paymentAmount < calculateTotal() || isProcessing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Memproses...' : 'Proses Pembayaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
