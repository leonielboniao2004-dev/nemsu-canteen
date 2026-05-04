export type PortalRole = "student" | "teacher";

export type Verification = {
  status: "unverified" | "pending" | "verified";
  idDataUrl?: string;
  submittedAt?: string;
  verifiedAt?: string;
};

type PortalUserBase = {
  email: string;
  name: string;
  studentId: string; // re-used as employee ID for teachers
  grade: string;     // for teachers we store department here
  section: string;   // for teachers we store subject here
  phone: string;
  avatarDataUrl?: string;
  verification?: Verification;
};

export type Session =
  | ({ role: "student" } & PortalUserBase)
  | ({ role: "teacher" } & PortalUserBase)
  | { role: "admin"; name: string; avatarDataUrl?: string };

const KEY = "canteen.session";

export const isPortalUser = (
  s: Session | null,
): s is Session & { role: PortalRole } => !!s && (s.role === "student" || s.role === "teacher");

export const getSession = (): Session | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

export const setSession = (s: Session) => {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(s));
};

export const updateSession = (patch: Partial<Session> & Record<string, any>) => {
  const cur = getSession();
  if (!cur) return null;
  const next = { ...cur, ...patch } as Session;
  setSession(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("canteen.session.update"));
  }
  return next;
};

export const clearSession = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
};
