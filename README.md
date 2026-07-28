# AhanSK — Ahandev Starter Kit

Starter Kit Monorepo skala menengah ke atas berbasis **NestJS**, **Next.js App Router**, dan **Turborepo** yang dirancang dengan prinsip **SSOT, DRY, Modular, dan Separation of Concerns (SOC)**.

---

## 🏛️ Arsitektur & Struktur Monorepo

```
ahansk/
├── apps/
│   ├── backend/    → NestJS API Server (Port 10311)
│   ├── frontend/   → Next.js User-Facing App Router (Port 10312)
│   └── admin/      → Next.js Admin Panel Dashboard (Port 10313)
├── packages/
│   ├── shared/     → Zod schemas, types, constants, i18n locales registry, pagination utils
│   └── ui/         → Shared UI Components & assets (Logo, favicon, shadcn tokens)
├── ecosystem.config.js → PM2 Cluster & Instance Configuration
└── turbo.json      → Turborepo Pipeline
```

---

## 🛠️ Tech Stack & Pilihan Arsitektur

| Layer | Teknologi & Library | Deskripsi / Aturan Kunci |
| :--- | :--- | :--- |
| **Monorepo Engine** | **Turborepo** + **pnpm workspaces** | Orchestration & caching tugas dev/build/test lintas workspace |
| **Backend** | **NestJS** (TypeScript) | Domain `api.domain.com`, tanpa prefix `/api`. Hanya route `/admin/*` dan `/v1/*` |
| **Frontend** | **Next.js 16 App Router** | Domain `domain.com`, styling murni Tailwind CSS di JSX, shadcn/ui |
| **Admin Panel** | **Next.js 16 App Router** | Domain `admin.domain.com`, tanpa prefix `/admin/` di URL, 2-layer auth |
| **ORM & Database** | **Prisma** + **MySQL / MariaDB** | Query DB eksklusif di `*.repository.ts`. Semua migrasi SQL wajib ter-track Git |
| **Validasi Data** | **Zod v4** (`z.object(...)`) | Backend: `ZodValidationPipe`; Frontend/Admin: `react-hook-form` + `zodResolver` |
| **Autentikasi** | **JWT httpOnly Cookie** + **Passport** | Access token (15m) & Refresh token (7d) di cookie httpOnly (`access_token`) |
| **Caching** | **Redis DB 1** (`@nestjs/cache-manager`) | Namespace `cache:*`. Di-invalidate eksplisit saat write (bukan Memcached) |
| **Queue** | **BullMQ + Redis DB 0** | Pemrosesan async/background jobs terpisah dari cache |
| **Internasionalisasi** | **next-intl** (`packages/shared/src/locales`) | SSOT terjemahan EN/ID di shared package, berbasis cookie `locale` |

---

## 📋 Prasyarat Sistem

Sebelum menjalankan project, pastikan lingkungan pengembangan Anda telah terinstal:
- **Node.js**: versi `>= 20.0.0`
- **pnpm**: versi `>= 9.0.0` (`npm install -g pnpm`)
- **Database**: MySQL / MariaDB lokal atau remote
- **Redis Server**: berjalan di port `6379` (minimal mendukung DB 0 & DB 1)

---

## 🚀 Quick Start (Pengembangan Lokal)

### 1. Kloning & Instalasi Dependensi
```bash
git clone <url-repository-anda> my-app
cd my-app
pnpm install
```

### 2. Konfigurasi Environment Variables (`.env`)
Salin file `.env.example` ke `.env` pada masing-masing workspace, lalu sesuaikan nilainya:
```bash
# Backend (apps/backend/.env)
cp apps/backend/.env.example apps/backend/.env

# Frontend (apps/frontend/.env.local)
cp apps/frontend/.env.example apps/frontend/.env.local

# Admin Panel (apps/admin/.env.local)
cp apps/admin/.env.example apps/admin/.env.local
```

> **Catatan Penting Backend (`apps/backend/.env`)**:
> Pastikan `DATABASE_URL` mengarah ke database MySQL/MariaDB yang aktif:
> `DATABASE_URL="mysql://root:@localhost:3306/ahansk"`

### 3. Migrasi & Seed Database (Prisma)
Jalankan migrasi skema database dan data awal langsung dari root monorepo:
```bash
pnpm run db:migrate
pnpm run db:seed
```

### 4. Jalankan Development Server (Serentak via Turborepo)
```bash
pnpm run dev
```
Setelah server berjalan, layanan akan dapat diakses pada:
- **Backend API**: http://localhost:10311 (`GET /` untuk cek status health)
- **Frontend App**: http://localhost:10312
- **Admin Dashboard**: http://localhost:10313

---

## 🧪 Perintah Pengembangan & Pengujian

Semua perintah di bawah dapat dijalankan dari root monorepo untuk mengeksekusi secara serentak ke seluruh packages/apps:

| Perintah | Fungsi |
| :--- | :--- |
| `pnpm run dev` | Menjalankan server pengembangan (`turbo run dev`) |
| `pnpm run build` | Kompilasi produksi TypeScript & Next.js (`turbo run build`) |
| `pnpm run lint` | Memeriksa linter ESLint di seluruh workspace |
| `pnpm run type-check` | Memeriksa tipe data TypeScript (`tsc --noEmit`) |
| `pnpm run test` | Menjalankan unit test Jest (berfokus pada servis & repositori) |
| `pnpm run format` | Memperbaiki format kode menggunakan Prettier |

---

## 🛡️ Pengujian (Testing) & Keamanan

Starter Kit ini dibangun dengan prioritas tinggi pada pengujian (skala *mid-to-high*), mencakup tes berlapis dari Unit hingga Load/Penetration Testing.

### 1. Unit & Integration Test
Digunakan untuk menguji *business logic* (Service) dan kueri database (Repository) secara terisolasi.
```bash
# Menjalankan test di seluruh workspaces
pnpm run test
```

### 2. End-to-End (E2E) Test API
Setiap modul di Backend (Auth, User, Blog, Settings, dll) dilengkapi dengan E2E spec penuh, memastikan integrasi controller, interceptor, validasi Zod, dan pengiriman email bekerja sempurna.
```bash
# Menjalankan spesifikasi E2E API di backend
pnpm --filter backend run test:e2e
```
*(Proses ini menggunakan setup global test environment, membersihkan data yang terisolasi, dan menggunakan otentikasi Cookie-based secara transparan).*

### 3. Load & Security Penetration Testing (CSRF)
Aplikasi diamankan menggunakan **Double-Submit Cookie** (header `x-csrf-token` vs cookie `csrf_token`).
Sebuah script pembuktian dan pengujian beban disiapkan untuk menguji ketahanan server.
```bash
# Lakukan bombard test & verifikasi keamanan mutasi secara live (opsional)
node apps/backend/scripts/bombard.mjs
```

---

## 📦 Panduan Deployment Produksi (PM2)

Project ini telah dilengkapi dengan file konfigurasi produksi `ecosystem.config.js` untuk dieksekusi oleh **PM2**.

### 1. Build Seluruh Aplikasi
```bash
pnpm run build
```

### 2. Jalankan Cluster PM2
```bash
# Menjalankan pertama kali
pm2 start ecosystem.config.js --env production

# Memuat ulang (reload dengan zero downtime sesudah update)
pm2 reload ecosystem.config.js --env production

# Mengecek status dan log aplikasi
pm2 status
pm2 logs ahansk-backend
```

---

## 📜 Aturan & Standar Pengembangan (SSOT)

1. **Batas Maksimal Baris Kode**: Setiap file kode maksimal **300 baris** (ideal: 200–300 baris). Jika melebihi batas, wajib dilakukan modulasisasi/pemecahan fungsi atau komponen.
2. **Keterbacaan & Tipe Data**: Dilarang keras menggunakan tipe `any`. Gunakan `unknown` + type narrowing atau Zod inferred types.
3. **Penyimpanan Token Auth**: Access token dan Refresh token diset langsung melalui **httpOnly cookie** oleh server backend. Frontend dan Admin tidak dibenarkan menyimpan token autentikasi di dalam `localStorage`.
4. **I18n / Lokalisasi**: Dilarang melakukan hardcode string UI di JSX/TSX. Semua string terjemahan disimpan pada SSOT registry di `packages/shared/src/locales`.
5. **Panduan Kustom**: Setiap penambahan konvensi baru wajib langsung diperbarui pada file panduan di dalam `.agents/rules/` (`project-guide.md`, `backend-app-guide.md`, `frontend-app-guide.md`, `admin-app-guide.md`).
