---
trigger: always_on
description: Standar dan aturan khusus NestJS backend — routing, auth, validasi, cache, dan lainnya
---

> **INSTRUKSI AGENT**: Setiap kali ada kesepakatan baru terkait backend (library baru, pola baru, gotcha baru, atau keputusan arsitektur NestJS) — **langsung perbarui file ini** sebelum lanjut ke pekerjaan lain.

# Backend App Guide — NestJS

## Stack & Library

- **ORM**: Prisma — akses DB **hanya** lewat `*.repository.ts`, bukan dari service/controller langsung.
- **Validasi**: Zod v4 via `ZodValidationPipe` (`common/pipes/zod-validation.pipe.ts`). **Bukan class-validator.**
- **Auth**: `@nestjs/jwt` + `@nestjs/passport`. Token di **httpOnly cookie** — lihat bagian Auth.
- **Cache**: `@nestjs/cache-manager` + `@keyv/redis` (default import), Redis DB 1, namespace `cache:`.
- **Queue**: BullMQ + Redis DB 0.
- **Logger**: `pino` via `nestjs-pino`. **Tidak boleh ada `console.*` di production code.**
- **Rate limit**: `@nestjs/throttler`.
- **Password**: `argon2` (Argon2id).
- **2FA**: `otplib` — **bukan speakeasy**.
- **Cookie parsing**: `cookie-parser` di `main.ts` — gunakan `import cookieParser = require('cookie-parser')`.

## Zod v4 Gotchas

- `ZodTypeAny` **dihapus** → gunakan `ZodType`.
- `.error.errors` **diganti** → `.error.issues`.
- `$ZodIssue.path` bertipe `PropertyKey[]` (bisa symbol) → gunakan `.map(String)` saat stringify.
- `@keyv/redis` → default import: `import KeyvAdapter from '@keyv/redis'`.

## Routing

- **Tidak ada prefix `/api`**. Backend di domain `api.domain.com`.
- Route structure:
  - (tanpa prefix) → route internal untuk Frontend user-facing
  - `/admin/*` → route untuk Admin Panel. **Prefix ini hanya di backend** — halaman Next.js admin tidak pakai `/admin/` di URL.
  - `/v1/*` → external API, auth pakai Personal Access Token
  - `/webhooks/*` → selalu POST, wajib verifikasi signature, tanpa CORS
- **CORS** tidak boleh wildcard `*` untuk route dengan auth/cookie. Origin frontend dan admin didaftarkan eksplisit.
- **CRUD hanya di 1 tempat (Service)**. Controller admin, user, `/v1/*` memanggil service yang sama.
- Struktur modul: `*.dto.ts` → `*.repository.ts` → `*.service.ts` → `*.controller.ts` → `*.module.ts`.
- Controller hanya orchestrator: terima request → validasi → panggil service → return response.
- Public route: `@Public()`. Admin route: `@Roles('ADMIN')`.

## Format Response API

Semua response lewat **interceptor global** (`response.interceptor.ts`):

```typescript
// Sukses
{ success: true, message: string, data: T | null }
// Gagal
{ success: false, message: string, error?: Record<string, string[]> }
```

Error handling lewat **Exception Filter global** (`http-exception.filter.ts`).

## HTTP Status

| Kode | Kasus |
|---|---|
| 200 | Read / update berhasil |
| 201 | Resource baru dibuat |
| 204 | Delete tanpa body |
| 400 | Input tidak valid |
| 401 | Belum login / token tidak valid |
| 403 | Tidak punya izin |
| 404 | Resource tidak ditemukan |
| 409 | Konflik |
| 422 | Validasi Zod gagal |
| 500 | Server error |

## Auth Token Strategy (Cookie-based)

- **Access token**: JWT, httpOnly cookie `access_token`, 15 menit.
- **Refresh token**: random 40-byte hex, httpOnly cookie `refresh_token` (path `/auth/refresh`), 7 hari. Hash SHA-256 di DB.
- `jwt.strategy.ts` ekstrak dari cookie `access_token` dulu, fallback ke `Authorization: Bearer`.
- Logout: `res.clearCookie()` keduanya.
- Frontend/Admin **tidak boleh simpan token di localStorage**.

## Caching

- Redis DB 1, `CacheService` di `infrastructure/cache/`. Namespace `cache:`.
- Redis DB 0 **khusus** BullMQ — jangan dipakai cache.
- Cache di-invalidate **eksplisit saat write**, bukan andalkan TTL pendek.

## Prisma Migrations

- Setiap ubah `schema.prisma`: `npx prisma migrate dev --name <nama>`.
- Dilarang menjalankan db push langsung ya 

## Personal Access Token & Secret

- PAT: plaintext dikembalikan **satu kali saja**. Yang disimpan di DB: hash SHA-256.
- Semua token/secret lain: **selalu hash**, tidak pernah plaintext.

## Pagination

Semua endpoint list pakai shape dari `@ahansk/shared`:

```
GET /posts?page=1&limit=20&sort=createdAt&order=desc
→ { items: T[], meta: { total, page, limit, totalPages, hasNext, hasPrev } }
```

Gunakan `PaginatedResponse<T>` dan `buildPaginationMeta()`.

## Testing

- Jest + Supertest. Unit test fokus di `*.service.ts` dan `*.repository.ts`. Coverage target: 70%.
- E2E: happy path auth flow dan endpoint CRUD utama.
- Test file di sebelah file yang ditest: `auth.service.spec.ts`.

## File Upload

- Gunakan `StorageService`. Konfigurasi upload (MIME type, ukuran, prefix folder) wajib di `src/config/filesystem.ts` sebagai SSOT (`DISK_CONFIGS`) — bukan inline di module/controller.
- **Simpan path relatif ke DB**, bukan full URL.
- Driver storage ditentukan env var `DISK=local|s3`. Validasi di `env.validation.ts`.

## Fitur Opsional (tambah hanya jika project membutuhkan)

- **Google Login**: `google-auth-library` — Google ID token selalu diverifikasi di server. Google One Tap di `frontend`, bukan admin.
- **Realtime**: `@nestjs/websockets` + `platform-socket.io`. Tambah ke dependencies hanya jika dibutuhkan.

## TypeScript

- **Dilarang `any`** — gunakan `unknown` + type narrowing.
- Gunakan tipe Prisma (`@prisma/client`) untuk semua entitas DB.
- Semua fungsi async wajib return type eksplisit.
- Semua DTO: Zod schema, derive type via `z.infer<typeof Schema>`.

## Checklist Backend

- [ ] Tidak ada prefix `/api` di route?
- [ ] Query Prisma hanya di `*.repository.ts`?
- [ ] Business logic hanya di `*.service.ts`?
- [ ] Input divalidasi Zod di controller?
- [ ] Auth endpoints set cookies via `res` (bukan return token di body)?
- [ ] Webhook ada verifikasi signature?
- [ ] Error lewat Exception Filter global?
- [ ] Tidak ada `any`? Tidak ada `console.*`?
- [ ] `.env.example` sinkron dengan `.env`?
- [ ] Prisma migration di-generate dan di-commit?