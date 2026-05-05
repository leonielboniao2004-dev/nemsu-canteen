import api from "@/api/index";

const TOKEN_KEY = "canteen.token";
const USER_KEY = "canteen.user";

// ── Token helpers ─────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem(TOKEN_KEY);

const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("canteen.session.update"));
};

// ── Session (sync, from localStorage cache) ───────────────────────────────────

export const getSession = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent("canteen.session.update"));
};

// ── Auth API calls ────────────────────────────────────────────────────────────

/** Login as student or teacher */
export const loginStudent = async ({ email, password, role = "student" }) => {
  const { data } = await api.post("/api/auth/login", { email, password, role });
  saveAuth(data.token, data.user);
  return data;
};

/** Login as vendor (key-based) */
export const loginVendor = async ({ vendorKey, password }) => {
  const { data } = await api.post("/api/auth/vendor-login", { vendorKey, password });
  saveAuth(data.token, data.user);
  return data;
};

/** Create a new student/teacher account */
export const signup = async ({ name, email, password, role, studentId, grade, section, phone }) => {
  const { data } = await api.post("/api/auth/signup", {
    name, email, password, role, studentId, grade, section, phone,
  });
  saveAuth(data.token, data.user);
  return data;
};

/** Fetch latest profile from server and refresh local cache */
export const refreshSession = async () => {
  try {
    const { data } = await api.get("/api/auth/me");
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("canteen.session.update"));
    return data;
  } catch {
    return null;
  }
};

/** Update profile fields */
export const updateProfile = async (patch) => {
  const { data } = await api.patch("/api/auth/me", patch);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("canteen.session.update"));
  return data;
};

/** Upload profile picture */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/api/upload/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  window.dispatchEvent(new CustomEvent("canteen.session.update"));
  return data.url;
};

/** Upload ID Card */
export const uploadIdCard = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/api/upload/id-card", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  window.dispatchEvent(new CustomEvent("canteen.session.update"));
  return data.url;
};

// ── Compat helpers (used by existing components) ──────────────────────────────
export const isPortalUser = (s) => !!s && (s.role === "student" || s.role === "teacher");

/** Legacy setSession shim — only used internally */
export const setSession = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent("canteen.session.update"));
};

export const updateSession = async (patch) => updateProfile(patch);
