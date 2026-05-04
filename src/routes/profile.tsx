import { createFileRoute, Navigate } from "@tanstack/react-router";

// /profile is now /settings — redirect any old links.
export const Route = createFileRoute("/profile")({
  component: () => <Navigate to="/settings" replace />,
});
