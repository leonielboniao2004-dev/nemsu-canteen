import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/")({
  component: Login,
  head: () => ({
    meta: [
      { title: "Login · School Canteen" },
      { name: "description", content: "Sign in to the School Canteen portal — students and admins." },
    ],
  }),
});
