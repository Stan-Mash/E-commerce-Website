import type { Metadata } from "next";
import AdminShell from "./AdminShell";
import { ToastProvider } from "@/components/admin";

// Force all admin pages to be dynamically rendered so Next.js never serves
// a stale router-cache RSC response (e.g. a pre-login redirect to /admin/login).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Admin · Elite Style Co.",
    template: "%s · Admin · Elite Style Co.",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is enforced exclusively by middleware.ts (Edge Middleware).
  // A duplicate cookies() check here breaks RSC client-side navigation in
  // Next.js 14 because cookies() returns empty during partial renders.
  return (
    <ToastProvider>
      <AdminShell>{children}</AdminShell>
    </ToastProvider>
  );
}
