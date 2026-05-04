import { createFileRoute } from "@tanstack/react-router";
import VendorNotifications from "@/pages/vendor/VendorNotifications";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/vendor/notifications")({
  component: () => (
    <RequireAuth role="admin">
      <VendorNotifications />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Notifications · Vendor" }] }),
});