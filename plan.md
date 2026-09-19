# Migration Plan: UUID to BIGINT Primary Key (V2 Clean Slate)

Dokumen ini adalah panduan eksekusi langkah-demi-langkah untuk mereplikasi migrasi total dari **UUID** ke **BIGINT AUTO_INCREMENT Primary Key** di monorepo, reset database secara menyeluruh, dan pembersihan total kata/konsep UUID dari codebase.

---

## 1. Tahap Persiapan & Branching V1
Simpan commit saat ini (arsip UUID) ke branch `v1`:
```bash
git branch v1
```
Pastikan tetap berada di branch `main` untuk melanjutkan proses migrasi V2.

---

## 2. Pembaruan Shared Contracts (`packages/shared`)
### A. Skema Auth User
File: `packages/shared/src/schemas/index.ts`
Ubah `id: z.string().uuid()` menjadi:
```ts
export const AuthUserSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['ADMIN', 'USER']),
  twoFactorEnabled: z.boolean(),
  avatar: z.string().nullable().optional(),
});
```

### B. Notification Types (SSOT)
File: `packages/shared/src/notification-types.ts`
Ubah `userId` dan `id` dari `string` menjadi `number`:
```ts
export interface NotificationPayload {
  type: NotificationType;
  userId: number;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
```

### C. Build Shared Package
```bash
pnpm --filter @ahansk/shared build
```

---

## 3. Database & Prisma Schema (`apps/backend/prisma`)
### A. Update `schema.prisma`
Ubah seluruh primary key dan foreign key ke `BigInt`:
1. **Model `User`**:
   - `id BigInt @id @default(autoincrement())`
   - `username String? @unique` *(hapus `@default(uuid())`)*
2. **Model Relasi User**:
   - `OAuthAccount`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `RefreshToken`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `TotpRecoveryCode`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `PasswordResetToken`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `EmailVerificationToken`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `UserActivity`: `id BigInt @id @default(autoincrement())`, `user_id BigInt?`
   - `Setting`: `id BigInt @id @default(autoincrement())`
   - `NewsItem`: `id BigInt @id @default(autoincrement())`, `author_id BigInt`
   - `Notification`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `PushSubscription`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `Otp`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `PendingEmailChange`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`
   - `UserBan`: `id BigInt @id @default(autoincrement())`, `user_id BigInt`, `banned_by BigInt`, `unbanned_by BigInt?`

### B. Reset Migration Lama
Hapus folder migrasi lama di `apps/backend/prisma/migrations/` dan file `migration_lock.toml`.

### C. Eksekusi Fresh Migration & Generate
Jalankan di folder `apps/backend` (atau via root pnpm):
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### D. Eksekusi Seeder
```bash
pnpm --filter backend db:seed
```
*Hasil: Admin `id: 1` (`admin@ahandev.com`), User `id: 2` (`user@ahandev.com`).*

---

## 4. Backend NestJS (`apps/backend`)
### A. BigInt Serialization Polyfill
File: `apps/backend/src/main.ts`
Tambahkan di awal fungsi `bootstrap()` sebelum membuat Nest app:
```ts
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};
```

### B. Pembersihan Kata UUID di Storage Drivers
Ganti `crypto.randomUUID()` dengan `crypto.randomBytes(16).toString('hex')` pada:
- `apps/backend/src/infrastructure/storage/drivers/local.driver.ts`
- `apps/backend/src/infrastructure/storage/drivers/s3.driver.ts`

### C. DTO Notifications
File: `apps/backend/src/modules/notifications/notification.dto.ts`
Ubah `userIds` di `BroadcastNotificationSchema`:
```ts
userIds: z.array(z.number().int().positive()).optional(),
```

### D. Modul Auth
- `auth.repository.ts`: Seluruh method (`findUserById`, `updateUser`, `createOAuthAccount`, `createRefreshToken`, dll.) menerima `number | bigint` dan melakukan konversi `BigInt(id)`.
- `auth-token.service.ts`:
  - `signAccessToken(userId: number | bigint)`: kirim `sub: Number(userId)` di JWT payload.
  - `issueTokens(userId: number | bigint, ...)`
  - `refresh(...)`: kirim `Number(record.user_id)` ke banService dan `signAccessToken(record.user_id)`.
- `auth.service.ts`:
  - `partialToken`: `this.jwt.sign({ sub: Number(user.id), type: 'partial' })`.
  - `issueTokens(userId: number, ...)`
  - `requestEmailChange(userId: number, ...)`
  - `verifyEmailChange(userId: number, ...)`
  - `resetPassword(...)`: notifikasi menggunakan `Number(record.user_id)`.
- `auth-totp.service.ts`:
  - `setupTotp`, `enableTotp`, `regenerateRecoveryCodes`, `disableTotp` menerima `userId: number`.
  - `verifyTotpLogin`: parse `Number(payload.sub)` dan return `issueTokens(Number(user.id))`.
- `auth-email-change.service.ts`:
  - `requestEmailChange(userId: number, ...)`, `verifyEmailChange(userId: number, ...)`.
  - Pengecekan race condition: `if (exists && exists.id !== BigInt(userId))`.
- `jwt.strategy.ts`:
  - `JwtPayload.sub: number | string`
  - Lookup: `this.usersRepo.findActiveById(Number(payload.sub))`
  - Return: `id: Number(user.id)`.

### E. Modul Users & Ban
- `users.repository.ts`: Method `findById`, `findActiveById`, `updateUser`, `deleteById`, `findActiveSessions`, `revokeSession`, `revokeAllSessions`, `findActivityByUser` menerima `number | bigint` dan query dengan `BigInt(...)`.
- `users.service.ts`: Update parameter method ke `number | bigint`.
- `users.admin.controller.ts`:
  - Import `ParseIntPipe`.
  - Ubah parameter ke `@Param('id', ParseIntPipe) id: number` dan `@Param('tokenId', ParseIntPipe) tokenId: number`.
- `ban.repository.ts`:
  - `ActiveBan.id: bigint`, `ActiveBan.admin.id: bigint`.
  - `userId: number | bigint`, `adminId: number | bigint` di-query menggunakan `BigInt(...)`.
- `ban.service.ts`:
  - `banUser(userId: number | bigint, adminId: number | bigint, ...)`
  - `unbanUser(userId: number | bigint, adminId: number | bigint)`
  - Notifikasi mengirim `userId: Number(userId)`.

### F. Modul News
- `news.repository.ts`: `findById`, `update`, `delete` menerima `number | bigint` (`where: { id: BigInt(id) }`).
- `news.service.ts`: `getById`, `create` (`author_id: BigInt(authorId)`), `update`, `delete` menerima `number | bigint`.
- `news.admin.controller.ts`:
  - Import `ParseIntPipe`.
  - Parameter: `@Param('id', ParseIntPipe) id: number`.

### G. Modul Notifications & Processors
- `notification.repository.ts`: Method menerima `userId: number | bigint` dan `id: number | bigint`. `getAllActiveUserIds(): Promise<number[]>`.
- `notification.service.ts`: `SendInput.userId: number | bigint`, `ChannelJob.userId: number | bigint`, `connect: { id: BigInt(input.userId) }`.
- `notification.controller.ts`:
  - Import `ParseIntPipe`.
  - `@Param('id', ParseIntPipe) id: number`.
- `notification-push.processor.ts`: `NotificationPushJob.userId: number | bigint`.
- `notification-email.processor.ts`: `NotificationEmailJob.userId: number | bigint`.

---

## 5. Next.js Admin App (`apps/admin`)
- `apps/admin/src/stores/auth.store.ts`: `AdminUser.id: number`.
- `apps/admin/src/app/users/page.tsx`:
  - `interface User { id: number; ... }`
  - `toggleActive: (id: number, ...) => ...`
  - `deleteUser: (id: number) => ...`
- `apps/admin/src/app/users/[id]/page.tsx`:
  - `interface UserDetail { id: number; bans: Array<{ id: number; banned_by: number; ... }> }`
- `apps/admin/src/app/users/[id]/user-sessions-panel.tsx`:
  - `interface Session { id: number; ... }`
  - `interface Activity { id: number; ... }`
  - `const [revoking, setRevoking] = useState<number | null>(null)`
  - `const revoke = async (tokenId: number) => ...`
- `apps/admin/src/app/news/page.tsx`:
  - `interface NewsItem { id: number; ... }`
  - `const [editing, setEditing] = useState<number | 'new' | null>(null)`
  - `const startEdit = async (id: number) => ...`
  - `const del = async (id: number) => ...`
- `apps/admin/src/app/notifications/notifications-view.tsx`:
  - `interface AdminNotif { id: number; ... user: { id: number; ... } }`

---

## 6. Next.js Frontend App (`apps/frontend`)
- `apps/frontend/src/stores/auth.store.ts`: `AuthUser.id: number`.
- `apps/frontend/src/app/dashboard/page.tsx`: `interface NewsItem { id: number; ... }`.
- `apps/frontend/src/app/dashboard/notifications/notifications-list.tsx`:
  - `mutationFn: (id: number) => api.patch('/notifications/' + id + '/read')`
- `apps/frontend/src/app/dashboard/account/notification-preferences/push-devices-modal.tsx`:
  - `interface PushSubscription { id: number; ... }`
  - `mutationFn: (id: number) => api.delete('/notifications/push/subscriptions/' + id)`

---

## 7. Verifikasi Akhir
1. **Pemeriksaan Kata UUID**:
   Pastikan pencarian kata `uuid` tidak menghasilkan temuan pada source code (`apps/**/src`, `packages/**/src`, `schema.prisma`).
2. **Build Monorepo**:
   ```bash
   pnpm build --force
   ```
   *Wajib: 4 packages sukses (shared, backend, admin, frontend), 0 error TypeScript.*
