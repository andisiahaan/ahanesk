# AhanESK — Admin Panel Dashboard (`apps/admin`)

Dashboard administrasi Next.js 16 App Router dari **AhanESK Monorepo**.

## 🚀 Fitur & Arsitektur Utama
- **Port Pengembangan**: `10323` (`turbo run dev`). URL aplikasi tidak menggunakan prefix `/admin/`.
- **Styling & UI Conventions**: Murni Tailwind CSS di JSX (`rounded-xl`, tabel dengan border & hover status badge yang rapi).
- **Autentikasi 2 Layer**:
  1. **Layer 1 (`src/proxy.ts`)**: Server-side proxy yang memvalidasi keberadaan cookie `access_token` dan mengarahkan ke `/auth/login` jika tidak ada.
  2. **Layer 2 (`AdminShell`)**: Client-side verify role dengan memanggil `fetchMe()` dari backend (`api.ts`).
- **State Management**: TanStack Query untuk server state dan Zustand untuk client state (`useAdminAuthStore` hanya menyimpan objek `user`).
- **Internasionalisasi (`next-intl`)**: Kamus terjemahan tersentralisasi di `packages/shared/src/locales/en/admin`.

## 🛠️ Cara Menjalankan
```bash
# Jalankan dari root monorepo
pnpm run dev --filter=admin
```
Atau jalankan seluruh monorepo secara serentak via `pnpm run dev` dari root, lalu buka [http://localhost:10323](http://localhost:10323).

## 📋 Environment Variables (`.env.local`)
Salin dari `.env.example`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:10321
NEXT_PUBLIC_FRONTEND_URL=http://localhost:10322
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```
