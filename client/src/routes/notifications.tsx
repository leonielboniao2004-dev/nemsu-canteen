import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/pages/Notifications";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/notifications")({
  component: () => (
    <RequireAuth role={["student", "teacher"]}>
      <Notifications />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Notifications · School Canteen" }] }),
});
