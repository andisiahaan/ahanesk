---
trigger: always_on
description: Panduan umum project ahansk — konteks, stack, prinsip kerja, dan aturan universal
---

> **INSTRUKSI AGENT**: Setiap kali ada kesepakatan baru, keputusan arsitektur, pola baru, atau standar baru yang disepakati bersama user — **wajib langsung dicatat di file guide yang sesuai** sebelum melanjutkan pekerjaan lain. Jika keputusan bersifat lintas-app (universal), catat di `project-guide.md`. Jika spesifik ke satu app atau layer, catat di guide yang relevan (`backend-app-guide.md`, `frontend-app-guide.md`, atau `admin-app-guide.md`).

# Project Guide — ahansk Starter Kit

Ini adalah **starter kit monorepo untuk project skala menengah ke atas**. Kerumitan yang diperlukan tidak dihindari — tidak ada jalan pintas, tidak ada alternatif yang lebih sederhana hanya untuk menghemat langkah.

## Prinsip Kerja Agent

- **JANGAN PERNAH commit Git** kecuali diminta eksplisit oleh user.
- **Klarifikasi sebelum aksi** — kalau task tidak jelas atau akan mengubah arsitektur, berhenti dan tanya dulu.
- Pastikan kode benar-benar berfungsi sebelum menyatakan pekerjaan selesai.
- Tidak boleh ada file kode **melebihi 300 baris**. Target ideal 200–300 baris.
- Prinsip wajib: **SSOT, SOC, DRY, MODULAR**, pemisahan tanggung jawab yang jelas.
- **Naming convention**: semua file `kebab-case`. Exception: komponen React boleh `PascalCase.tsx`.
- **Bur/Error Fix** : DILARANG MELAKUKAN PERBAIKAN ALTERNATIF, HARUS MELAKUKAN BEST PRACTICE BAHKAN JIKA MENYEBABKAN PERUBAHAN BESAR, DISKUSIKAN DULU

## Tech Stack

| Layer | Pilihan |
|---|---|
| Backend | NestJS |
| Frontend (user-facing) | Next.js App Router |
| Admin | Next.js App Router |
| ORM | Prisma (MySQL/MariaDB) |
| Package manager | pnpm workspaces |
| Task orchestrator | Turborepo (Full Monorepo) |
| Cache | Redis DB 1, namespace `cache:*` — **bukan Memcached** |
| Queue | Redis DB 0 + BullMQ |
| Validasi | Zod v4 (backend: global `ZodValidationPipe` + `createZodDto` class; frontend: react-hook-form + zodResolver) |
| i18n | next-intl, cookie-based locale, semua locale di `packages/shared` |

## Monorepo Structure

```
apps/
  backend/    → NestJS (port 10311)
  frontend/   → Next.js user-facing (port 10312)
  admin/      → Next.js admin panel (port 10313)
packages/
  shared/     → Zod schemas, types, constants, i18n localeRegistry, pagination utils
  ui/         → Komponen & asset shared antar Next.js apps (Logo, favicon)
```

## Import Path Aliases

- `@/` → alias `src/` per app
- `@ahansk/shared` → `packages/shared`
- `@ahansk/ui` → `packages/ui`

## Deployment

- PM2 via `ecosystem.config.js` di root monorepo.
- Backend production: cluster mode.
- Frontend & Admin production: `script: 'node_modules/.bin/next'`, `args: 'start'`.

## Hal yang SELALU DILARANG (lintas semua app)

- Commit Git tanpa diminta eksplisit oleh user.
- File kode lebih dari 300 baris tanpa alasan sangat kuat.
- Hardcode URL, secret, atau value yang seharusnya di `.env`.
- Menyimpan token/secret dalam bentuk plaintext di database.
- Menyimpan access token di `localStorage` — wajib httpOnly cookie.
- Duplikasi CRUD logic di beberapa controller.
- Menyimpan URL lengkap file ke database — simpan path relatif.
- Menggunakan `speakeasy` — wajib `otplib`.
- Menggunakan Memcached — cache wajib Redis.
- Menggunakan `ZodTypeAny` — dihapus di Zod v4, pakai `ZodType`.
- Menggunakan `.error.errors` di Zod — pakai `.error.issues`.
- Menggunakan named import `{ KeyvAdapter }` dari `@keyv/redis` — pakai default import.
- Menambahkan `@types/otplib` — otplib v12+ sudah bundle types.
- Menggunakan `import * as cookieParser` — pakai `import cookieParser = require(...)`.
- Melakukan mutasi data tanpa memverifikasi CSRF Token di backend (Double-Submit Cookie).
- Menggunakan alias `type` pada DTO di controller NestJS. Wajib memakai `class` via `createZodDto`.