import { Navigate } from "@/lib/router-compat";
import { getSession } from "@/lib/auth";
import * as React from "react";
export const RequireAuth = ({ children, role, }) => {
    const session = getSession();
    if (!session)
        return <Navigate to="/" replace/>;
    if (role) {
        let allowed = Array.isArray(role) ? role : [role];
        // For backwards compatibility, treat admin and vendor interchangeably for these routes
        if (allowed.includes("admin") && !allowed.includes("vendor")) {
            allowed = [...allowed, "vendor"];
        }
        if (!allowed.includes(session.role))
            return <Navigate to="/dashboard" replace/>;
    }
    return children;
};
