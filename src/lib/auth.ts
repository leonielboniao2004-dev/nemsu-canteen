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
const PROFILES_KEY = "canteen.profiles";

type ProfileData = Partial<Pick<PortalUserBase, "name" | "phone" | "grade" | "section" | "avatarDataUrl" | "verification" | "studentId">> & { role?: PortalRole };

const readProfiles = (): Record<string, ProfileData> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};
const writeProfiles = (p: Record<string, ProfileData>) => {
  if (typeof window !== "undefined") window.localStorage.setItem(PROFILES_KEY, JSON.stringify(p));
};

/** Returns saved profile data (avatar, verification, etc.) for an email. */
export const getProfile = (email: string, role: PortalRole): ProfileData => {
  const all = readProfiles();
  const key = `${role}:${email.toLowerCase()}`;
  return all[key] ?? {};
};
const saveProfile = (email: string, role: PortalRole, data: ProfileData) => {
  const all = readProfiles();
  const key = `${role}:${email.toLowerCase()}`;
  all[key] = { ...all[key], ...data, role };
  writeProfiles(all);
};

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
  if (typeof window === "undefined") return;
  let next: Session = s;
  // Restore saved profile (avatar, verification, edits) for portal users.
  if (s.role === "student" || s.role === "teacher") {
    const saved = getProfile(s.email, s.role);
    next = { ...s, ...saved, role: s.role, email: s.email } as Session;
    saveProfile(s.email, s.role, next as ProfileData);
  }
  window.localStorage.setItem(KEY, JSON.stringify(next));
};

export const updateSession = (patch: Partial<Session> & Record<string, any>) => {
  const cur = getSession();
  if (!cur) return null;
  const next = { ...cur, ...patch } as Session;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  if (next.role === "student" || next.role === "teacher") {
    saveProfile(next.email, next.role, next as ProfileData);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("canteen.session.update"));
  }
  return next;
};

export const clearSession = () => {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
};
