import { useEffect, useState } from "react";
import { Navigate } from "@/lib/router-compat";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

/**
 * @param {{ children: any, role?: any }} props
 */
export const RequireAuth = (props) => {
  const { children, role } = props;
  const [ready, setReady] = useState(() => getSession() !== null);
  const [tick, setTick] = useState(0);
  const [hasAuthUser, setHasAuthUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasAuthUser(!!data.session);
      setReady(true);
    });
    const onUpdate = () => setTick((x) => x + 1);
    window.addEventListener("canteen.session.update", onUpdate);
    return () => { mounted = false; window.removeEventListener("canteen.session.update", onUpdate); };
  }, []);

  const session = getSession();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (hasAuthUser === false && !session) return <Navigate to="/" replace />;
  if (hasAuthUser && !session) {
    // Auth user exists but profile still loading
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }
  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(session.role)) return <Navigate to="/dashboard" replace />;
  }
  return children;
};
