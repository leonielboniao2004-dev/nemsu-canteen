import { createFileRoute } from "@tanstack/react-router";
import Orders from "@/pages/Orders";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/orders")({
  component: () => (
    <RequireAuth role={["student", "teacher"]}>
      <Orders />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "My Reservations · School Canteen" }] }),
});
