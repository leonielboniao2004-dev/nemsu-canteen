import { createFileRoute } from "@tanstack/react-router";
import VendorCustomers from "@/pages/vendor/VendorCustomers";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/vendor/customers")({
  component: () => (
    <RequireAuth role="admin">
      <VendorCustomers />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Customers · Vendor" }] }),
});