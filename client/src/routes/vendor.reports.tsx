import { createFileRoute } from "@tanstack/react-router";
import VendorReports from "@/pages/vendor/VendorReports";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/vendor/reports")({
  component: () => (
    <RequireAuth role="admin">
      <VendorReports />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Reports · Vendor" }] }),
});