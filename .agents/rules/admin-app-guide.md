---
trigger: always_on
glob:
description: Standar khusus admin panel (Next.js App Router) — auth guard, UI conventions, i18n, checklist
---

> **INSTRUKSI AGENT**: Setiap kali ada kesepakatan baru terkait admin panel (pola auth, UI convention baru, perubahan i18n, struktur route) — **langsung perbarui file ini** sebelum lanjut ke pekerjaan lain.

# Admin App Guide — Next.js (Admin Panel)

App: `apps/admin` — domain `admin.domain.com`

## Konteks & Arsitektur

- Admin panel di domain terpisah. Halaman Next.js admin **tidak perlu prefix `/admin/`** di URL-nya.
- Alur fetch: halaman `app/blog/page.tsx` (URL: `/blog`) → endpoint backend `api.domain.com/admin/blog`.
- `apps/admin` seluruhnya adalah dashboard. **Tidak ada folder `dashboard/` atau route group `(dashboard)/`**.
- Halaman auth: `app/auth/login/page.tsx` → URL `/auth/login`.

## Route Protection (2 Layer)

1. **`src/middleware.ts`** (Next.js middleware): cek cookie `access_token` dan set cookie `locale`. Tidak ada token pada route terproteksi → redirect ke `/auth/login?from=<pathname>`.
2. **`AdminShell`** (client-side): `fetchMe()` — verify user masih ADMIN, populate store. Tidak ada token di `localStorage`.

Auth store (`useAdminAuthStore`) hanya menyimpan objek `user` — tidak ada `accessToken`. Setelah login, panggil `fetchMe()` untuk populate store.

## Styling & UI Conventions

- Aturan Tailwind & CSS sama dengan frontend (lihat frontend-app-guide.md).
- Tabel data: border, `rounded-xl`, header `bg-muted`, hover row `hover:bg-muted/50`.
- Badge status/type: inline dengan `cn()`.
- Sidebar active state: `border-primary bg-primary/10 text-primary`.
- Navigasi aktif: `pathname.startsWith(item.href)`, kecuali root → exact match.

## Data Fetching & State

- Sama dengan frontend: axios instance `src/lib/api.ts` dengan `withCredentials: true`, auto-refresh on 401.
- **Server state**: TanStack Query. **Client state**: Zustand.
- **Dilarang fetch langsung di komponen UI**.

## i18n (Internasionalisasi)

- **Semua string UI wajib `next-intl`** — dilarang hardcode string dalam JSX/TSX.
- **Tidak ada folder `messages/` atau `locales/` di dalam `apps/admin`** — semua locale ada di `packages/shared`.

Arsitektur locale (SSOT di shared):
```
packages/shared/src/locales/
  en/
    modules/    ← cross-app: auth, common, blog (field labels)
    admin/      ← khusus admin: nav, dashboard, blog (mgmt), users, news, settings
    frontend/   ← khusus frontend (tidak dipakai di sini)
```

Di `i18n/request.ts`:
```ts
import { localeRegistry } from '@ahansk/shared';
const { modules, admin } = localeRegistry[locale];
// messages: { auth, common, blog: {...modules.blog, ...admin.blog},
//             nav, dashboard, users, news, settings }
```

- Menambah namespace baru: tambah JSON di `shared/src/locales/en/admin/`, import di `en/index.ts`, wiring di `request.ts`.

## TypeScript

- **Dilarang `any`** — gunakan `unknown` + type narrowing.
- Semua fungsi async wajib return type eksplisit.
- Prop komponen gunakan interface, bukan `any`.

## Environment Variables

- `.env` dan `.env.example` wajib sinkron.
- Tidak ada hardcode URL/secret.

## Checklist Admin

- [ ] Route protection ada di 2 layer (`src/middleware.ts` + `AdminShell`)?
- [ ] Auth store tidak menyimpan token, hanya `user` object?
- [ ] Login flow: `api.post('/auth/login')` → `fetchMe()` → cek role ADMIN?
- [ ] Semua API call via `src/lib/api.ts`?
- [ ] Tidak ada URL hardcoded?
- [ ] File tidak melebihi 300 baris?
- [ ] Tampilan dicek di Mobile, Tablet, Desktop?
- [ ] Semua string UI pakai `useTranslations()` / `getTranslations()`?
- [ ] Key terjemahan ditambahkan ke `shared/src/locales/en/admin/`?

## Yang DILARANG

- Prefix `/admin/` di URL halaman Next.js admin.
- Token/accessToken disimpan di `localStorage` atau di state store.
- Folder `messages/` atau `locales/` di dalam `apps/admin`.
- **Hardcode string UI** tanpa terjemahan.
- Membuat komponen yang sudah ada di `components/ui/`.
- Fetch langsung di komponen UI.
