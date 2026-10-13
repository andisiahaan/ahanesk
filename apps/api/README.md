# AhanESK — Backend API Server (`apps/backend`)

Server API NestJS (TypeScript) dari **AhanESK Monorepo**.

## 🚀 Fitur & Arsitektur Utama
- **Port Pengembangan**: `10321` (`turbo run dev`). Endpoint tidak menggunakan prefix `/api`.
- **Health Check Endpoint**: `GET /` (bersifat `@Public()`) mengembalikan `{ name: 'ahanesk-backend', status: 'running', version: '1.0.0' }`.
- **ORM & Database**: Prisma ORM untuk akses database MySQL/MariaDB. Seluruh migrasi SQL di `prisma/migrations` wajib di-commit ke Git.
- **Validasi Zod v4**: Menggunakan `ZodValidationPipe` (`common/pipes/zod-validation.pipe.ts`) dengan `ZodType` (bukan class-validator).
- **Autentikasi Cookie**: JWT Access token (`access_token`, 15m) & Refresh token (`refresh_token`, 7d) dikirim eksklusif lewat cookie `httpOnly`.
- **Google OAuth**: Verifikasi ID token via `google-auth-library` pada endpoint `POST /auth/google`.
- **Storage System**: Terpusat di `StorageService`. Driver `local` menyimpan file ke root monorepo `/storage` (dilayani langsung oleh web server), sedangkan driver `s3` mendukung S3-compatible cloud storage. Diatur via `.env` `DISK=local|s3`.
- **Cache & Queue**: Redis DB 1 (`cache:*`) untuk caching `@nestjs/cache-manager`, dan Redis DB 0 untuk BullMQ.

## 🛠️ Cara Menjalankan
```bash
# Jalankan dari root monorepo
pnpm run dev --filter=backend
```
Atau jalankan serentak via `pnpm run dev` dari root.

## 📋 Environment Variables (`.env`)
Salin dari `.env.example`:
```bash
cp .env.example .env
```
Pastikan `DATABASE_URL`, rahasia JWT, dan konfigurasi `REDIS_URL` telah disesuaikan dengan environment lokal Anda.
