import { createFileRoute } from "@tanstack/react-router";
import AdminOrders from "@/pages/AdminOrders";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/admin/orders")({
  component: () => (
    <RequireAuth role="admin">
      <AdminOrders />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Order Queue · Vendor" }] }),
});
