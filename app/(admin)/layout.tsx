import AdminSidebar from '@/components/admin/admin-sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-20 md:pt-6">{children}</main>
    </div>
  );
}
