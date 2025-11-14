'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { MdDashboard, MdShoppingCart, MdInventory, MdCategory, MdPeople, MdPerson, MdAssessment, MdLogout, MdMenu, MdClose } from 'react-icons/md';
import { getImageUrl } from '@/lib/api/axios';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Proteksi: Hanya admin yang bisa akses dashboard
  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin') {
      router.push('/kasir');
    }
  }, [user, isLoading, router]);

  // Loading state
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

  // Jika bukan admin, jangan tampilkan apapun (akan di-redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: MdDashboard },
    { name: 'Transaksi', href: '/dashboard/transactions', icon: MdShoppingCart },
    { name: 'Produk', href: '/dashboard/products', icon: MdInventory },
    { name: 'Kategori', href: '/dashboard/categories', icon: MdCategory },
    { name: 'Customer', href: '/dashboard/customers', icon: MdPeople },
    { name: 'Users', href: '/dashboard/users', icon: MdPerson },
    { name: 'Laporan', href: '/dashboard/reports', icon: MdAssessment },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">TallyPOS</h1>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {user?.avatarUrl && getImageUrl(user.avatarUrl) ? (
              <img
                src={getImageUrl(user.avatarUrl)!}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="text-xl" />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <MdLogout className="text-xl" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navbar */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <MdClose className="text-2xl" /> : <MdMenu className="text-2xl" />}
          </button>

          <h2 className="text-lg lg:text-xl font-semibold text-gray-800">
            {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
          </h2>
          
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="hidden md:block text-xs lg:text-sm text-gray-600">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
