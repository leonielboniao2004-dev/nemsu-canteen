const KEY = "canteen.session";
const PROFILES_KEY = "canteen.profiles";
const readProfiles = () => {
    if (typeof window === "undefined")
        return {};
    try {
        const raw = window.localStorage.getItem(PROFILES_KEY);
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
};
const writeProfiles = (p) => {
    if (typeof window !== "undefined")
        window.localStorage.setItem(PROFILES_KEY, JSON.stringify(p));
};
/** Returns saved profile data (avatar, verification, etc.) for an email. */
export const getProfile = (email, role) => {
    const all = readProfiles();
    const key = `${role}:${email.toLowerCase()}`;
    return all[key] ?? {};
};
const saveProfile = (email, role, data) => {
    const all = readProfiles();
    const key = `${role}:${email.toLowerCase()}`;
    all[key] = { ...all[key], ...data, role };
    writeProfiles(all);
};
export const isPortalUser = (s) => !!s && (s.role === "student" || s.role === "teacher");
export const getSession = () => {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
};
export const setSession = (s) => {
    if (typeof window === "undefined")
        return;
    let next = s;
    // Restore saved profile (avatar, verification, edits) for portal users.
    if (s.role === "student" || s.role === "teacher") {
        const saved = getProfile(s.email, s.role);
        next = { ...s, ...saved, role: s.role, email: s.email };
        saveProfile(s.email, s.role, next);
    }
    window.localStorage.setItem(KEY, JSON.stringify(next));
};
export const updateSession = (patch) => {
    const cur = getSession();
    if (!cur)
        return null;
    const next = { ...cur, ...patch };
    if (typeof window !== "undefined")
        window.localStorage.setItem(KEY, JSON.stringify(next));
    if (next.role === "student" || next.role === "teacher") {
        saveProfile(next.email, next.role, next);
    }
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("canteen.session.update"));
    }
    return next;
};
export const clearSession = () => {
    if (typeof window !== "undefined")
        window.localStorage.removeItem(KEY);
};
