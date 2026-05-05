import { createFileRoute } from "@tanstack/react-router";
import Cart from "@/pages/Cart";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/cart")({
  component: () => (
    <RequireAuth role={["student", "teacher"]}>
      <Cart />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Your Cart · School Canteen" }] }),
});
