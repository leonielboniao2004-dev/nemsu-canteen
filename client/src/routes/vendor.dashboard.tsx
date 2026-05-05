import { createFileRoute } from "@tanstack/react-router";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/vendor/dashboard")({
  component: () => (
    <RequireAuth role="admin">
      <VendorDashboard />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Dashboard · Vendor" }] }),
});