import { Navigate } from "@/lib/router-compat";
import { getSession, type Session } from "@/lib/auth";
import * as React from "react";

type Role = Session["role"];

export const RequireAuth = ({
  children,
  role,
}: {
  children: React.ReactElement;
  role?: Role | Role[];
}) => {
  const session = getSession();
  if (!session) return <Navigate to="/" replace />;
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(session.role)) return <Navigate to="/dashboard" replace />;
  }
  return children;
};
