import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useProjects } from "../hooks/useProjects";
import { useWorkforce } from "../hooks/useWorkforce";
import { useEntityStore } from "../hooks/useEntityStore";
import PreferencesMenu from "../components/PreferencesMenu";
import { IconBuilding, IconCrane, IconUsers, IconAlert, IconCheck } from "../components/Icons";
import "./LoginPage.css";

const DEMO_GOOGLE_ACCOUNTS = [
  { name: "Karthik Selvam", email: "karthik.selvam@gmail.com" },
  { name: "Meera Iyer", email: "meera.iyer@gmail.com" },
];

function GoogleG(props) {
  return (
    <svg viewBox="0 0 18 18" width={18} height={18} {...props}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

export default function LoginPage() {
  const { isAuthenticated, login, signUpClient, continueWithGoogle, requestOtp, verifyOtp, isSubmitting, homeRoute } =
    useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Real counts from whatever the person has actually entered so far —
  // every value starts at 0 until data exists, nothing here is seeded.
  const { allProjects } = useProjects();
  const { summary } = useWorkforce();
  const { records: units } = useEntityStore("siteflow.units", "UNT");

  const [view, setView] = useState("signin"); // 'signin' | 'signup'
  const [method, setMethod] = useState("password"); // 'password' | 'otp'
  const [otpStage, setOtpStage] = useState("phone"); // 'phone' | 'code'
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleCustomEntry, setGoogleCustomEntry] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");

  const [signupForm, setSignupForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [googleForm, setGoogleForm] = useState({ name: "", email: "" });

  const [formError, setFormError] = useState("");

  if (isAuthenticated) {
    return <Navigate to={location.state?.from ?? homeRoute} replace />;
  }

  function goHome(user) {
    const roleHome = { admin: "/projects", engineer: "/construction", client: "/client-dashboard" }[user.role];
    navigate(location.state?.from ?? roleHome, { replace: true });
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setFormError("");
    try {
      const user = await login({ email, password });
      goHome(user);
    } catch {
      setFormError("No account matches that email and password.");
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    setFormError("");
    try {
      const user = await signUpClient(signupForm);
      goHome(user);
    } catch (err) {
      setFormError(err.message || "Check the details and try again.");
    }
  }

  async function handleGooglePick(profile) {
    setFormError("");
    try {
      const user = await continueWithGoogle(profile);
      setShowGoogleChooser(false);
      goHome(user);
    } catch {
      setFormError("Google sign-in couldn't complete. Try again.");
    }
  }

  async function handleRequestOtp(event) {
    event.preventDefault();
    setFormError("");
    try {
      await requestOtp(phone);
      setOtpStage("code");
    } catch {
      setFormError("Enter a valid mobile number.");
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setFormError("");
    try {
      const user = await verifyOtp(phone, otpCode, otpName);
      goHome(user);
    } catch (err) {
      setFormError(
        err.message === "otp-expired"
          ? "That code expired — request a new one."
          : "That code doesn't match. Try again."
      );
    }
  }

  return (
    <div className="login">
      <section className="login__hero grid-surface reg-mark">
        <div className="login__hero-top">
          <span className="login__brand-mark">
            <IconBuilding />
          </span>
          <span className="login__brand-name">{t("appName")}</span>
        </div>

        <div className="login__hero-copy">
          <h1>{t("tagline")}</h1>
          <p>
            Projects, units, crews, materials and daily site progress — tracked in one workspace, from
            foundation to handover. Admins, engineers and clients each get their own workspace, automatically.
          </p>
        </div>

        <ul className="login__hero-stats">
          <li>
            <IconCrane />
            <div>
              <strong>{allProjects.length}</strong>
              <span>{t("heroActiveProjects")}</span>
            </div>
          </li>
          <li>
            <IconUsers />
            <div>
              <strong>{summary.onSite}</strong>
              <span>{t("heroWorkersOnSite")}</span>
            </div>
          </li>
          <li>
            <IconBuilding />
            <div>
              <strong>{units.length}</strong>
              <span>{t("heroUnitsTracked")}</span>
            </div>
          </li>
        </ul>
      </section>

      <section className="login__form-panel">
        <div className="login__form-panel-top">
          <PreferencesMenu align="right" />
        </div>

        <div className="login__form">
          <div className="login__view-switch">
            <button
              type="button"
              className={view === "signin" ? "is-active" : ""}
              onClick={() => {
                setView("signin");
                setFormError("");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={view === "signup" ? "is-active" : ""}
              onClick={() => {
                setView("signup");
                setFormError("");
              }}
            >
              New client? Create account
            </button>
          </div>

          {view === "signin" ? (
            <>
              <h2>{t("loginTitle")}</h2>

              {formError && (
                <div className="login__error" role="alert">
                  <IconAlert />
                  <span>{formError}</span>
                </div>
              )}

              <button type="button" className="login__google-btn" onClick={() => setShowGoogleChooser(true)}>
                <GoogleG /> Continue with Google
              </button>

              <div className="login__divider">
                <span>or</span>
              </div>

              <div className="login__method-switch">
                <button
                  type="button"
                  className={method === "password" ? "is-active" : ""}
                  onClick={() => {
                    setMethod("password");
                    setFormError("");
                  }}
                >
                  Email &amp; password
                </button>
                <button
                  type="button"
                  className={method === "otp" ? "is-active" : ""}
                  onClick={() => {
                    setMethod("otp");
                    setOtpStage("phone");
                    setFormError("");
                  }}
                >
                  Mobile OTP
                </button>
              </div>

              {method === "password" && (
                <form onSubmit={handlePasswordSubmit} noValidate>
                  <label className="login__field">
                    <span>{t("email")}</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      required
                    />
                  </label>

                  <label className="login__field">
                    <span>{t("password")}</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  <button type="submit" className="login__submit" disabled={isSubmitting}>
                    {isSubmitting ? t("signingIn") : t("signIn")}
                  </button>
                </form>
              )}

              {method === "otp" && otpStage === "phone" && (
                <form onSubmit={handleRequestOtp} noValidate>
                  <label className="login__field">
                    <span>Mobile number</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      required
                    />
                  </label>
                  <button type="submit" className="login__submit">
                    Send OTP
                  </button>
                </form>
              )}

              {method === "otp" && otpStage === "code" && (
                <form onSubmit={handleVerifyOtp} noValidate>
                  <div className="login__otp-sent">
                    Code sent to <strong>{phone}</strong>.
                    <button type="button" onClick={() => setOtpStage("phone")}>
                      Change
                    </button>
                  </div>
                  <label className="login__field">
                    <span>Your name (first time only)</span>
                    <input
                      value={otpName}
                      onChange={(e) => setOtpName(e.target.value)}
                      placeholder="For a new account"
                    />
                  </label>
                  <label className="login__field">
                    <span>Enter OTP</span>
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="4-digit code"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <button type="submit" className="login__submit" disabled={isSubmitting}>
                    {isSubmitting ? t("signingIn") : "Verify & sign in"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h2>Create your client account</h2>
              <p className="login__subtitle">
                Self sign-up is for clients tracking their own project. Engineer and admin logins are issued by
                your site admin.
              </p>

              {formError && (
                <div className="login__error" role="alert">
                  <IconAlert />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} noValidate>
                <label className="login__field">
                  <span>Full name</span>
                  <input
                    value={signupForm.name}
                    onChange={(e) => setSignupForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    required
                  />
                </label>
                <label className="login__field">
                  <span>{t("email")}</span>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@email.com"
                    required
                  />
                </label>
                <label className="login__field">
                  <span>Mobile number</span>
                  <input
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label className="login__field">
                  <span>{t("password")}</span>
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="At least 4 characters"
                    required
                  />
                </label>
                <button type="submit" className="login__submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account…" : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {showGoogleChooser && (
        <div className="google-chooser-overlay" onMouseDown={() => setShowGoogleChooser(false)}>
          <div className="google-chooser" onMouseDown={(e) => e.stopPropagation()}>
            <div className="google-chooser__header">
              <GoogleG width={22} height={22} />
              <div>
                <strong>Sign in with Google</strong>
                <span>Choose an account</span>
              </div>
            </div>

            {!googleCustomEntry ? (
              <>
                <ul className="google-chooser__list">
                  {DEMO_GOOGLE_ACCOUNTS.map((acc) => (
                    <li key={acc.email}>
                      <button type="button" onClick={() => handleGooglePick(acc)}>
                        <span className="google-chooser__avatar">{acc.name.charAt(0)}</span>
                        <span>
                          <strong>{acc.name}</strong>
                          <span>{acc.email}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="google-chooser__other"
                  onClick={() => setGoogleCustomEntry(true)}
                >
                  Use another account
                </button>
              </>
            ) : (
              <form
                className="google-chooser__form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGooglePick(googleForm);
                }}
              >
                <label className="login__field">
                  <span>Name</span>
                  <input
                    value={googleForm.name}
                    onChange={(e) => setGoogleForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </label>
                <label className="login__field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={googleForm.email}
                    onChange={(e) => setGoogleForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </label>
                <button type="submit" className="login__submit">
                  <IconCheck /> Continue
                </button>
              </form>
            )}

            <button type="button" className="google-chooser__cancel" onClick={() => setShowGoogleChooser(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
