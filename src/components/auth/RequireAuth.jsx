import { Navigate } from "@/lib/router-compat";
import { getSession } from "@/lib/auth";
import * as React from "react";
/**
 * @param {{ children: any, role?: any }} props
 */
export const RequireAuth = (props) => {
    const { children, role } = props;
    const session = getSession();
    if (!session)
        return <Navigate to="/" replace/>;
    if (role) {
        const allowed = Array.isArray(role) ? role : [role];
        if (!allowed.includes(session.role))
            return <Navigate to="/dashboard" replace/>;
    }
    return children;
};
