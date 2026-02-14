import { AppShell } from '@/components/layout';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | undefined;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data?.user?.email ?? undefined;
  } catch {
    // Supabase unavailable or auth error — render shell without user info
  }

  return <AppShell userEmail={userEmail}>{children}</AppShell>;
}
