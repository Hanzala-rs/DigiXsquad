import { AdminGuard } from '@/components/admin/AdminSession';
import { AdminShell } from '@/components/admin/AdminShell';

/** Every admin page except /admin/login: requires a session. */
export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
