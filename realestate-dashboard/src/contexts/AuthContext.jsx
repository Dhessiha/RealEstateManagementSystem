import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { apiFetch, getToken, setToken } from "../lib/apiClient";

// Every sign-in path below resolves a role from the server's account
// directory — nobody is ever asked "are you an admin, engineer or
// client?". The role travels with the account, decided at the moment
// the account was created (seeded owner login, admin-created staff
// login, or self-service sign-up), and the server is the source of
// truth for it — not anything typed at sign-in.
export const AuthContext = createContext(null);

const ROLE_HOME = {
  admin: "/projects",
  engineer: "/construction",
  client: "/client-dashboard",
};

export function AuthProvider({ children }) {
  const [user, setUser, clearUser] = useLocalStorage("siteflow.user", null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOtp, setPendingOtp] = useState(null); // { phone }

  // A token can outlive the cached user object (or vice versa, if the
  // account was removed server-side) — reconcile against /auth/me once
  // on load rather than trusting the local cache blindly.
  useEffect(() => {
    if (!getToken()) return;
    apiFetch("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken(null);
        setUser(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = useCallback(
    ({ token, user: account }) => {
      setToken(token);
      setUser(account);
      return account;
    },
    [setUser]
  );

  const runAuthCall = useCallback(
    async (call) => {
      setError("");
      setIsSubmitting(true);
      try {
        const result = await call();
        return settle(result);
      } catch (err) {
        setError(err.message || "Something went wrong. Try again.");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [settle]
  );

  const login = useCallback(
    ({ email, password }) => runAuthCall(() => apiFetch("/auth/login", { method: "POST", body: { email, password } })),
    [runAuthCall]
  );

  const signUpClient = useCallback(
    (details) => runAuthCall(() => apiFetch("/auth/signup", { method: "POST", body: details })),
    [runAuthCall]
  );

  const continueWithGoogle = useCallback(
    (googleProfile) => runAuthCall(() => apiFetch("/auth/google", { method: "POST", body: googleProfile })),
    [runAuthCall]
  );

  const requestOtp = useCallback(async (phone) => {
    setError("");
    try {
      const data = await apiFetch("/auth/otp/request", { method: "POST", body: { phone } });
      setPendingOtp({ phone });
      // No SMS gateway in this demo — the code comes back in the
      // response so the login screen can show it on-screen.
      return data.code;
    } catch (err) {
      setError(err.message || "Enter a valid mobile number.");
      throw err;
    }
  }, []);

  const verifyOtp = useCallback(
    (phone, code, name) =>
      runAuthCall(() => apiFetch("/auth/otp/verify", { method: "POST", body: { phone, code, name } })).finally(() =>
        setPendingOtp(null)
      ),
    [runAuthCall]
  );

  /** Admin-only helper: create an engineer/admin login via the server. */
  const addStaffMember = useCallback(async (details) => {
    const data = await apiFetch("/auth/staff", { method: "POST", body: details });
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    clearUser();
    setUser(null);
  }, [clearUser, setUser]);

  const hasValidRole = !!user && Object.prototype.hasOwnProperty.call(ROLE_HOME, user.role);
  const homeRoute = useMemo(() => ROLE_HOME[user?.role] ?? "/login", [user]);

  // A stray cached user without a resolvable role (or one left over from
  // a build that used a different auth scheme) must never look
  // "authenticated" — otherwise /login redirects to itself forever.
  useEffect(() => {
    if (user && !hasValidRole) {
      setToken(null);
      clearUser();
      setUser(null);
    }
  }, [user, hasValidRole, clearUser, setUser]);

  const value = useMemo(
    () => ({
      user: hasValidRole ? user : null,
      isAuthenticated: hasValidRole,
      role: hasValidRole ? user.role : null,
      homeRoute,
      login,
      signUpClient,
      continueWithGoogle,
      requestOtp,
      verifyOtp,
      addStaffMember,
      logout,
      error,
      isSubmitting,
      pendingOtp,
    }),
    [
      user,
      hasValidRole,
      homeRoute,
      login,
      signUpClient,
      continueWithGoogle,
      requestOtp,
      verifyOtp,
      addStaffMember,
      logout,
      error,
      isSubmitting,
      pendingOtp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
