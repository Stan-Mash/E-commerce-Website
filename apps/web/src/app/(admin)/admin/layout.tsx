import type { Metadata } from "next";
import AdminShell from "./AdminShell";
import { ToastProvider } from "@/components/admin";

// Force all admin pages to be dynamically rendered so Next.js never serves
// a stale router-cache RSC response (e.g. a pre-login redirect to /admin/login).
export const dynamic = "force-dynamic";

// Nested title templates compose: this produces the string the ROOT
// layout's own "%s | Elite Style Co." template then wraps — so this one
// must NOT also append "Elite Style Co.", or every admin page ends up
// "... · Admin · Elite Style Co. | Elite Style Co." in the tab title.
export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
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
