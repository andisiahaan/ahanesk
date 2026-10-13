import { PublicLayout } from '@/components/layouts/public-layout';

export default function PagesLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
