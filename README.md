# Frontend-TallyPOS Documentation

## Overview

Frontend-TallyPOS adalah aplikasi Point of Sale (POS) berbasis web yang dibangun menggunakan Next.js, React, dan TypeScript. Aplikasi ini dirancang untuk membantu pengelolaan transaksi penjualan, manajemen produk, pelanggan, laporan, dan pengguna, serta menyediakan fitur kasir yang mudah digunakan.

## Fitur Utama
- **Autentikasi & Proteksi Halaman**: Menggunakan JWT dan context untuk mengelola sesi login dan proteksi halaman.
- **Dashboard**: Menampilkan ringkasan data penting seperti transaksi, produk, pelanggan, dan laporan.
- **Manajemen Produk, Kategori, Pelanggan, Pengguna**: CRUD data melalui halaman dashboard.
- **Kasir**: Fitur transaksi penjualan dan riwayat transaksi.
- **Laporan**: Melihat dan mengunduh laporan penjualan.

## Struktur Folder
```
├── app/
│   ├── dashboard/         # Halaman dashboard & sub-menu (kategori, produk, pelanggan, laporan, transaksi, pengguna)
│   ├── kasir/             # Halaman kasir & riwayat transaksi
│   ├── login/             # Halaman login
│   ├── layout.tsx         # Layout utama aplikasi
│   └── globals.css        # Global styling
├── components/
│   └── ProtectedRoute.tsx # Komponen proteksi route
├── contexts/
│   └── AuthContext.tsx    # Context autentikasi
├── lib/
│   ├── api/               # API client & service (auth, produk, pelanggan, dsb)
│   └── utils/             # Utility (jwt, dsb)
├── public/                # Asset publik
├── package.json           # Konfigurasi npm & dependensi
├── tsconfig.json          # Konfigurasi TypeScript
├── next.config.ts         # Konfigurasi Next.js
```

## Instalasi & Menjalankan Project
1. **Clone repository**
	```bash
	git clone <repo-url>
	cd Frontend-TallyPOS
	```
2. **Install dependencies**
	```bash
	npm install
	# atau
	yarn install
	# atau
	pnpm install
	# atau
	bun install
	```
3. **Jalankan development server**
	```bash
	npm run dev
	# atau yarn dev / pnpm dev / bun dev
	```
4. **Akses aplikasi**
	Buka [http://localhost:3000](http://localhost:3000) di browser.

## Penjelasan Komponen Penting
- **AuthContext**: Mengelola status login, user, dan token JWT. Otomatis logout jika token expired.
- **ProtectedRoute**: Membungkus halaman yang butuh autentikasi. Redirect ke login jika belum login.
- **lib/api/**: Berisi fungsi API untuk auth, produk, pelanggan, dsb. Menggunakan axios.
- **lib/utils/jwt.ts**: Utility untuk decode dan cek expiry JWT.

## Tips Pengembangan
- Edit halaman utama di `app/page.tsx`.
- Tambahkan halaman baru di dalam folder `app/`.
- Gunakan context & komponen yang sudah ada untuk konsistensi autentikasi.
- Untuk styling, gunakan Tailwind CSS (sudah terpasang).

## Deployment
Deploy mudah ke Vercel atau platform lain yang mendukung Next.js. Lihat dokumentasi Next.js untuk detail lebih lanjut.

---

**Catatan:**
- Pastikan backend API sudah berjalan dan endpoint sesuai dengan yang digunakan di `lib/api/`.
- Untuk pengembangan lebih lanjut, tambahkan validasi, notifikasi, dan fitur sesuai kebutuhan bisnis.
