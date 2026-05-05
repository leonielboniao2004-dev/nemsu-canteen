import { createFileRoute } from "@tanstack/react-router";
import VendorProducts from "@/pages/vendor/VendorProducts";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/vendor/products")({
  component: () => (
    <RequireAuth role="admin">
      <VendorProducts />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Products · Vendor" }] }),
});