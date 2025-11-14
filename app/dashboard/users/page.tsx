'use client';

import { useEffect, useState } from 'react';
import { userApi, User, UserCreateDto, UserUpdateDto } from '@/lib/api/users';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiLock, FiUnlock, FiX } from 'react-icons/fi';
import { getImageUrl } from '@/lib/api/axios';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<UserCreateDto>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'kasir',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getAll();
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Gagal memuat data users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((u) => u.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((u) => !u.isActive);
    }

    setFilteredUsers(filtered);
  };

  const handleOpenModal = (mode: 'create' | 'edit', user?: User) => {
    setModalMode(mode);
    if (mode === 'edit' && user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '', // Password tidak ditampilkan saat edit
        fullName: user.fullName,
        role: user.role,
      });
      // Set existing avatar preview
      if (user.avatarUrl) {
        setAvatarPreview(getImageUrl(user.avatarUrl));
      }
    } else {
      setSelectedUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'kasir',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'create') {
        const newUser = await userApi.create(formData);
        toast.success('User berhasil ditambahkan');
        
        // Upload avatar if file selected
        if (avatarFile && newUser.id) {
          setIsUploadingAvatar(true);
          try {
            await userApi.uploadUserAvatar(newUser.id, avatarFile);
            toast.success('Avatar berhasil diupload');
          } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Gagal upload avatar');
          } finally {
            setIsUploadingAvatar(false);
          }
        }
      } else if (selectedUser) {
        const updateData: UserUpdateDto = {
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
        };
        await userApi.update(selectedUser.id, updateData);
        
        // Upload avatar if new file selected
        if (avatarFile) {
          setIsUploadingAvatar(true);
          try {
            await userApi.uploadUserAvatar(selectedUser.id, avatarFile);
            toast.success('User dan avatar berhasil diupdate');
          } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('User diupdate tapi gagal upload avatar');
          } finally {
            setIsUploadingAvatar(false);
          }
        } else {
          toast.success('User berhasil diupdate');
        }
      }
      
      // Refresh users data
      await fetchUsers();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan user');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    // Prevent deleting current user
    if (currentUser?.sub === id) {
      toast.error('Anda tidak bisa menghapus akun sendiri');
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus user "${username}"?`)) {
      return;
    }

    try {
      await userApi.delete(id);
      toast.success('User berhasil dihapus');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus user');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Prevent deactivating current user
    if (currentUser?.sub === id && currentStatus) {
      toast.error('Anda tidak bisa menonaktifkan akun sendiri');
      return;
    }

    try {
      await userApi.update(id, { isActive: !currentStatus });
      toast.success(`User berhasil ${currentStatus ? 'dinonaktifkan' : 'diaktifkan'}`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast.error('Gagal mengubah status user');
    }
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

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      kasir: 'bg-blue-100 text-blue-800',
    };
    const labels = {
      admin: 'Admin',
      kasir: 'Kasir',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badges[role as keyof typeof badges]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
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
          <h2 className="text-xl font-semibold text-gray-900">Manajemen Users</h2>
          <button
            onClick={() => handleOpenModal('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Tambah User</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari User
            </label>
            <input
              type="text"
              placeholder="Username, email, atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="kasir">Kasir</option>
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
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Admin</p>
            <p className="text-2xl font-bold text-purple-600">
              {filteredUsers.filter((u) => u.role === 'admin').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Kasir</p>
            <p className="text-2xl font-bold text-blue-600">
              {filteredUsers.filter((u) => u.role === 'kasir').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Users Aktif</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredUsers.filter((u) => u.isActive).length}
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'Tidak ada user yang sesuai dengan filter'
                      : 'Belum ada user. Klik tombol "Tambah User" untuk menambahkan.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {user.avatarUrl && getImageUrl(user.avatarUrl) ? (
                          <img
                            src={getImageUrl(user.avatarUrl)!}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-gray-200"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            user.role === 'admin' 
                              ? 'bg-gradient-to-br from-purple-400 to-purple-600' 
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            <span className="text-white font-semibold text-sm">
                              {user.fullName.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                          {currentUser?.sub === user.id && (
                            <p className="text-xs text-blue-600 font-medium">You</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      @{user.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenModal('edit', user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition duration-150"
                          title="Edit"
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`p-2 text-yellow-600 hover:bg-yellow-50 rounded transition duration-150 ${
                            currentUser?.sub === user.id && user.isActive ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          disabled={currentUser?.sub === user.id && user.isActive}
                        >
                          {user.isActive ? <FiLock className="text-lg" /> : <FiUnlock className="text-lg" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className={`p-2 text-red-600 hover:bg-red-50 rounded transition duration-150 ${
                            currentUser?.sub === user.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Hapus"
                          disabled={currentUser?.sub === user.id}
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
                {modalMode === 'create' ? 'Tambah User Baru' : 'Edit User'}
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
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: John Doe"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="johndoe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              {/* Password - Only for create */}
              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                  />
                </div>
              )}

              {/* Role - Only for create */}
              {modalMode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'kasir' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="kasir">Kasir</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Role tidak dapat diubah setelah user dibuat
                  </p>
                </div>
              )}

              {/* Avatar Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar {modalMode === 'create' && <span className="text-gray-500 text-xs">(Opsional)</span>}
                </label>
                  
                  {/* Avatar Preview */}
                  {avatarPreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-24 h-24 object-cover rounded-full border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        title="Hapus avatar"
                      >
                        <FiX className="text-sm" />
                      </button>
                    </div>
                  )}

                  {/* File Input */}
                  {!avatarPreview && (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition text-center">
                        <div className="text-gray-600 mb-2">
                          <span className="text-3xl">👤</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Klik untuk upload avatar
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF, WEBP hingga 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
              </div>

              {modalMode === 'edit' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    💡 Password dan role tidak dapat diubah melalui form edit.
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-150"
                  disabled={isUploadingAvatar}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading avatar...
                    </>
                  ) : (
                    modalMode === 'create' ? 'Tambah User' : 'Simpan Perubahan'
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
