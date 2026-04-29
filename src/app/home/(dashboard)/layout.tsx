import { UserLayout } from '@/components/layouts/UserLayout';

export default function HomeRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserLayout>{children}</UserLayout>;
}
