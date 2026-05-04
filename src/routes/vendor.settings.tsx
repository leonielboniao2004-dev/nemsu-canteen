import { createFileRoute } from "@tanstack/react-router";
import VendorSettings from "@/pages/vendor/VendorSettings";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/vendor/settings")({
  component: () => (
    <RequireAuth role="admin">
      <VendorSettings />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Settings · Vendor" }] }),
});