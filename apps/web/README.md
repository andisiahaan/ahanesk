# AhanESK — Frontend User-Facing (`apps/frontend`)

Aplikasi Next.js 16 App Router untuk sisi pengguna (user-facing) dari **AhanESK Monorepo**.

## 🚀 Fitur & Arsitektur Utama
- **Port Pengembangan**: `10322` (berjalan secara serentak via `turbo run dev` dari root).
- **Styling**: Murni Tailwind CSS utility class di JSX + token shadcn/ui (`components/ui`).
- **Autentikasi**: Berbasis cookie `httpOnly` (`access_token`) dari backend (`api.ts` dengan `withCredentials: true` & auto-refresh on 401).
- **Google OAuth**: Mendukung Google Sign-In & Google One Tap via `@react-oauth/google` terintegrasi dengan endpoint backend `/auth/google`.
- **Storage / Asset Images**: Menggunakan helper `getImageUrl(path)` membaca `NEXT_PUBLIC_STORAGE_URL` (terhubung ke root monorepo `/storage` via web server atau S3).
- **Proxy Boundary**: `src/proxy.ts` sebagai proteksi route SSR dan penentuan otomatis cookie `locale` dari header browser (`Accept-Language`).
- **Internasionalisasi**: Menggunakan `next-intl` dengan kamus terjemahan tersentralisasi di `packages/shared/src/locales/en/frontend`.

## 🛠️ Cara Menjalankan
```bash
# Jalankan dari root monorepo
pnpm run dev --filter=frontend
```
Or run all apps concurrently with `pnpm run dev` from root, then open [http://localhost:10322](http://localhost:10322).

## 📋 Environment Variables (`.env.local`)
Salin dari `.env.example`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:10321
NEXT_PUBLIC_STORAGE_URL=http://ahansk.test/storage
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```
