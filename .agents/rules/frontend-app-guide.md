---
trigger: always_on
glob:
description: Standar khusus frontend user-facing (Next.js App Router) — styling, data fetching, i18n, form
---

> **INSTRUKSI AGENT**: Setiap kali ada kesepakatan baru terkait frontend (komponen baru, pola baru, perubahan i18n, standar UI) — **langsung perbarui file ini** sebelum lanjut ke pekerjaan lain.

# Frontend App Guide — Next.js (User-Facing)

App: `apps/frontend` — domain `domain.com`

## Styling & Komponen

- **Tidak ada file CSS untuk komponen/element**. File `.css` hanya untuk color tokens (`:root`, `.dark`, `@theme inline`).
- Semua styling komponen: **Tailwind utility class langsung di JSX**.
- **Tidak boleh ada style inline** untuk hal yang bisa dilakukan dengan Tailwind class.
- Komponen reusable (Button, Input, Label, dll) di `components/ui/` — jangan buat ulang yang sudah ada.
- Token naming: shadcn/ui convention — `bg-primary`, `text-muted-foreground`, `bg-card`, `border-border`, `text-destructive`.
- Dark/Light mode: `ThemeProvider` + class `.dark` di `<html>`.
- Conflict class: gunakan `cn()` dari `clsx` + `tailwind-merge` (`src/lib/cn.ts`).

## Data Fetching & State

- **Dilarang hardcode URL** — selalu gunakan axios instance dari `src/lib/api.ts`.
- **Dilarang fetch langsung di komponen UI** — lewat `src/lib/api.ts` atau TanStack Query.
- Server Components pakai `apiFetch` dari `src/lib/api.ts`.
- **Server state**: TanStack Query. **Client state**: Zustand.
- `api.ts` menggunakan `withCredentials: true` dan auto-refresh on 401.

## Form & Validasi

- Form: **React Hook Form + `zodResolver`**.
- Schema Zod di-share lewat `packages/shared` (SSOT validasi).

## Responsive

- Wajib dioptimasi minimal: Mobile, Tablet, Desktop.

## i18n (Internasionalisasi)

- **Semua string UI wajib `next-intl`** — dilarang hardcode string dalam JSX/TSX.
- Client Components: `useTranslations('namespace')`. Server Components: `getTranslations('namespace')`.
- **Tidak ada folder `messages/` atau `locales/` di dalam `apps/frontend`** — semua locale ada di `packages/shared`.

Arsitektur locale (SSOT di shared):
```
packages/shared/src/locales/
  en/
    modules/    ← cross-app: auth, common, blog (field labels)
    frontend/   ← khusus frontend: nav, blog (reader context)
    admin/      ← khusus admin (tidak dipakai di sini)
```

Di `i18n/request.ts`:
```ts
import { localeRegistry } from '@ahansk/shared';
const { modules, frontend } = localeRegistry[locale];
// messages: { auth, common, blog: {...modules.blog, ...frontend.blog}, nav: frontend.nav }
```

- Locale: cookie `locale` (1 tahun) diset otomatis di `src/middleware.ts` dari header `Accept-Language`. Guest: cookie. User login: `user.preferences.locale`.
- Menambah namespace baru: tambah JSON di `shared/src/locales/en/frontend/`, import di `en/index.ts`, wiring di `request.ts`.
- `next-intl/plugin` **tidak** mengekspor tipe `Config`. Cukup:
  ```ts
  import createNextIntlPlugin from 'next-intl/plugin';
  export default createNextIntlPlugin('./src/i18n/request.ts');
  ```

## TypeScript

- **Dilarang `any`** — gunakan `unknown` + type narrowing.
- Semua fungsi async wajib return type eksplisit.
- Prop komponen gunakan interface, bukan `any`.

## Environment Variables

- `.env` dan `.env.example` wajib sinkron.
- Tidak ada hardcode URL/secret di kode.

## Checklist Frontend

- [ ] Semua API call via `src/lib/api.ts`?
- [ ] Route protection SSR dan penentuan cookie locale via `src/middleware.ts`?
- [ ] Tidak ada URL hardcoded?
- [ ] Logic fetch di custom hook atau TanStack Query?
- [ ] State management layer tepat (local / Zustand)?
- [ ] Prop komponen pakai interface, bukan `any`?
- [ ] File tidak melebihi 300 baris?
- [ ] Tampilan dicek di Mobile, Tablet, Desktop?
- [ ] Semua string UI pakai `useTranslations()` / `getTranslations()`?
- [ ] Key terjemahan ditambahkan ke `shared/src/locales/en/frontend/`?

## Yang DILARANG

- Menulis class CSS komponen di file `.css`.
- Style inline untuk hal yang bisa pakai Tailwind.
- Membuat komponen yang sudah ada di `components/ui/`.
- Fetch langsung di komponen UI.
- **Hardcode string UI** tanpa terjemahan.
- Folder `messages/` atau `locales/` di dalam `apps/frontend`.
