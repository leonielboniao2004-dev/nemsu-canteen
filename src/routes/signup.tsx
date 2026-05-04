import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/pages/Signup";

export const Route = createFileRoute("/signup")({
  component: Signup,
  head: () => ({
    meta: [
      { title: "Sign up · School Canteen" },
      { name: "description", content: "Create your School Canteen student account." },
    ],
  }),
});
