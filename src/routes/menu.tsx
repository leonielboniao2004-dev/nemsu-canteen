import { createFileRoute } from "@tanstack/react-router";
import Menu from "@/pages/Menu";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/menu")({
  component: () => (
    <RequireAuth role={["student", "teacher"]}>
      <Menu />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Today's Menu · School Canteen" }] }),
});
