// Compatibility shim that exposes a tiny subset of `react-router-dom`'s API
// on top of @tanstack/react-router so legacy components continue to work.
import * as React from "react";
import { Link as TLink, useNavigate as tUseNavigate, useLocation as tUseLocation, useRouter, } from "@tanstack/react-router";
export const Link = React.forwardRef(function Link({ to, children, replace, state, ...rest }, ref) {
    return (<TLink ref={ref} to={to} replace={replace} {...rest}>
      {children}
    </TLink>);
});
export function useNavigate() {
    const nav = tUseNavigate();
    return React.useCallback((to, opts) => {
        if (typeof to === "number") {
            if (typeof window !== "undefined")
                window.history.go(to);
            return;
        }
        nav({ to, replace: opts?.replace });
    }, [nav]);
}
export function useLocation() {
    return tUseLocation();
}
export function Navigate({ to, replace }) {
    const nav = tUseNavigate();
    React.useEffect(() => {
        nav({ to, replace });
    }, [to, replace, nav]);
    return null;
}
export const NavLink = React.forwardRef(function NavLink({ to, className, children, ...rest }, ref) {
    const loc = tUseLocation();
    const isActive = loc.pathname === to;
    const cls = typeof className === "function"
        ? className({ isActive, isPending: false })
        : className;
    return (<TLink ref={ref} to={to} className={cls} {...rest}>
      {typeof children === "function" ? children({ isActive, isPending: false }) : children}
    </TLink>);
});
export function useParams() {
    // Not currently used, but kept for compatibility.
    return {};
}
export { useRouter };
