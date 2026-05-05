import { createFileRoute } from "@tanstack/react-router";
import VendorOrders from "@/pages/vendor/VendorOrders";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/vendor/orders")({
  component: () => (
    <RequireAuth role="admin">
      <VendorOrders />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Orders · Vendor" }] }),
});