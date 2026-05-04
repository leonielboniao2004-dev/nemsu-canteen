import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";
import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/settings")({
  component: () => (
    <RequireAuth role={["student", "teacher"]}>
      <Settings />
    </RequireAuth>
  ),
  head: () => ({ meta: [{ title: "Settings · School Canteen" }] }),
});
