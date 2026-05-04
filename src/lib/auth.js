import { supabase } from "@/integrations/supabase/client";

const KEY = "canteen.session";
const EVT = "canteen.session.update";

let _session = null;
const readCache = () => {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
};
const writeCache = (s) => {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  _session = s;
  window.dispatchEvent(new CustomEvent(EVT));
};
_session = readCache();

const profileToSession = (p) => {
  if (!p) return null;
  if (p.role === "admin") {
    return { role: "admin", name: p.name || "Vendor", avatarDataUrl: p.avatar_url || undefined, userId: p.id, email: p.email };
  }
  return {
    role: p.role,
    userId: p.id,
    email: p.email,
    name: p.name || "",
    studentId: p.student_id || "",
    grade: p.grade || "",
    section: p.section || "",
    phone: p.phone || "",
    avatarDataUrl: p.avatar_url || undefined,
    verification: {
      status: p.verification_status || "unverified",
      idDataUrl: p.verification_id_url || undefined,
      submittedAt: p.verification_submitted_at || undefined,
      verifiedAt: p.verification_verified_at || undefined,
    },
  };
};

export const getSession = () => _session;

export const isPortalUser = (s) => !!s && (s.role === "student" || s.role === "teacher");

export const refreshProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { writeCache(null); return null; }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  const isAdmin = (roles || []).some((r) => r.role === "admin");
  const merged = profile ? { ...profile, role: isAdmin ? "admin" : profile.role } : null;
  writeCache(profileToSession(merged));
  return _session;
};

export const setSession = (s) => writeCache(s); // legacy no-op compat (rarely used now)

export const updateSession = async (patch) => {
  if (!_session || !_session.userId) return null;
  const dbPatch = {};
  if ("name" in patch) dbPatch.name = patch.name;
  if ("phone" in patch) dbPatch.phone = patch.phone;
  if ("grade" in patch) dbPatch.grade = patch.grade;
  if ("section" in patch) dbPatch.section = patch.section;
  if ("studentId" in patch) dbPatch.student_id = patch.studentId;
  if ("avatarDataUrl" in patch) dbPatch.avatar_url = patch.avatarDataUrl ?? null;
  if ("verification" in patch && patch.verification) {
    dbPatch.verification_status = patch.verification.status;
    dbPatch.verification_id_url = patch.verification.idDataUrl ?? null;
    dbPatch.verification_submitted_at = patch.verification.submittedAt ?? null;
    dbPatch.verification_verified_at = patch.verification.verifiedAt ?? null;
  }
  if (Object.keys(dbPatch).length) {
    await supabase.from("profiles").update(dbPatch).eq("id", _session.userId);
  }
  writeCache({ ..._session, ...patch });
  return _session;
};

export const clearSession = async () => {
  await supabase.auth.signOut();
  writeCache(null);
};

export const signInWithEmail = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  await refreshProfile();
  return _session;
};

export const signUpWithEmail = async ({ email, password, name, role, studentId, grade, section, phone }) => {
  const redirect = typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: redirect,
      data: { name, role, student_id: studentId, grade, section, phone },
    },
  });
  if (error) throw error;
  await refreshProfile();
  return _session;
};

// Listen to auth state changes (init from root component)
let _initialized = false;
export const initAuth = () => {
  if (_initialized || typeof window === "undefined") return;
  _initialized = true;
  supabase.auth.onAuthStateChange((_e, session) => {
    if (!session) writeCache(null);
    else setTimeout(() => { refreshProfile(); }, 0);
  });
  refreshProfile();
};

// Legacy getProfile shim
export const getProfile = () => ({});
