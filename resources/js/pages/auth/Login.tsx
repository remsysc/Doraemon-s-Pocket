import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
    login,
    type LoginPayload,
    type ValidationErrorResponse,
} from "../../lib/api";
import "../../../css/auth.css";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState<LoginPayload>({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!form.email || !form.password) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            await login(form);
            navigate("/dashboard");
        } catch (err) {
            if (err instanceof AxiosError && err.response?.status === 422) {
                const data = err.response.data as ValidationErrorResponse;
                const firstError = Object.values(data.errors)[0]?.[0];
                setError(firstError ?? "Invalid credentials.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* ── Background Clouds ── */}
            <div className="floating-cloud cloud-1" />
            <div className="floating-cloud cloud-2" />
            <div className="floating-cloud cloud-3" />

            {/* ── Left panel — brand & scene ── */}
            <div className="auth-page__scene">
                {/* Brand + tagline overlay */}
                <div className="auth-scene-content">
                    <div className="auth-scene-content__brand">
                        {/* Doraemon face logomark */}
                        <svg
                            viewBox="0 0 80 80"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Doraemon's Pocket"
                            style={{ width: 36, height: 36 }}
                        >
                            <circle cx="40" cy="37" r="36" fill="#00A8E0" />
                            <ellipse cx="40" cy="51" rx="24" ry="20" fill="#fff" />
                            <circle cx="28" cy="30" r="9" fill="#fff" />
                            <circle cx="52" cy="30" r="9" fill="#fff" />
                            <circle cx="30" cy="31" r="5.5" fill="#111" />
                            <circle cx="54" cy="31" r="5.5" fill="#111" />
                            <circle cx="31.5" cy="29" r="2" fill="#fff" />
                            <circle cx="55.5" cy="29" r="2" fill="#fff" />
                            <circle cx="40" cy="44" r="5" fill="#E0332E" />
                            <path d="M26 54 Q40 66 54 54" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <line x1="40" y1="49" x2="40" y2="54" stroke="#111" strokeWidth="2" />
                            <line x1="5"  y1="44" x2="26" y2="48" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="5"  y1="51" x2="26" y2="51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="5"  y1="58" x2="26" y2="54" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="54" y1="48" x2="75" y2="44" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="54" y1="51" x2="75" y2="51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="54" y1="54" x2="75" y2="58" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                            <rect x="10" y="70" width="60" height="9" rx="4" fill="#E0332E" />
                            <circle cx="40" cy="79" r="6" fill="#F5C400" />
                            <circle cx="40" cy="79" r="1.8" fill="#9A7D00" />
                            <line x1="34" y1="79" x2="46" y2="79" stroke="#9A7D00" strokeWidth="1.2" />
                        </svg>
                        <span className="auth-brand-name">Doraemon's Pocket</span>
                    </div>

                    <div className="auth-scene-content__tagline">
                        Inventory<br />
                        <span className="text-gradient">Intelligence</span><br />
                        Simplified.
                    </div>

                    <p className="auth-scene-content__description">
                        A unified platform for stock control, lot tracking, and supply chain visibility — built for appliance distribution.
                    </p>

                    <div className="auth-scene-content__features">
                        <div className="auth-scene-feature">
                            <span className="auth-scene-feature__dot" />
                            <div className="auth-scene-feature__body">
                                <span className="auth-scene-feature__title">Real-time Stock Overview</span>
                                <span className="auth-scene-feature__desc">Monitor quantities, lots, and movement across all locations.</span>
                            </div>
                        </div>
                        <div className="auth-scene-feature">
                            <span className="auth-scene-feature__dot" />
                            <div className="auth-scene-feature__body">
                                <span className="auth-scene-feature__title">Reorder Intelligence</span>
                                <span className="auth-scene-feature__desc">EOQ, ROP, and safety stock powered by demand analytics.</span>
                            </div>
                        </div>
                        <div className="auth-scene-feature">
                            <span className="auth-scene-feature__dot" />
                            <div className="auth-scene-feature__body">
                                <span className="auth-scene-feature__title">Role-based Access</span>
                                <span className="auth-scene-feature__desc">Tailored dashboards for Admin, Warehouse, and Purchasing.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right panel — login form ── */}
            <div className="auth-page__form-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-header__brand">
                            <svg
                                viewBox="0 0 80 80"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                style={{ width: 26, height: 26, display: 'inline-block', verticalAlign: 'middle' }}
                            >
                                <circle cx="40" cy="37" r="36" fill="#00A8E0" />
                                <ellipse cx="40" cy="51" rx="24" ry="20" fill="#fff" />
                                <circle cx="28" cy="30" r="9" fill="#fff" />
                                <circle cx="52" cy="30" r="9" fill="#fff" />
                                <circle cx="30" cy="31" r="5.5" fill="#111" />
                                <circle cx="54" cy="31" r="5.5" fill="#111" />
                                <circle cx="31.5" cy="29" r="2" fill="#fff" />
                                <circle cx="55.5" cy="29" r="2" fill="#fff" />
                                <circle cx="40" cy="44" r="5" fill="#E0332E" />
                                <path d="M26 54 Q40 66 54 54" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <line x1="40" y1="49" x2="40" y2="54" stroke="#111" strokeWidth="2" />
                                <line x1="5"  y1="44" x2="26" y2="48" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="5"  y1="51" x2="26" y2="51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="5"  y1="58" x2="26" y2="54" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="54" y1="48" x2="75" y2="44" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="54" y1="51" x2="75" y2="51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="54" y1="54" x2="75" y2="58" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
                                <rect x="10" y="70" width="60" height="9" rx="4" fill="#E0332E" />
                                <circle cx="40" cy="79" r="6" fill="#F5C400" />
                                <circle cx="40" cy="79" r="1.8" fill="#9A7D00" />
                                <line x1="34" y1="79" x2="46" y2="79" stroke="#9A7D00" strokeWidth="1.2" />
                            </svg>
                            Doraemon's Pocket
                        </h2>
                        <p className="auth-header__system">Supply Chain &amp; Distribution</p>
                        <h1>Welcome back</h1>
                        <p>Sign in to your account to continue</p>
                    </div>

                    <div aria-live="polite">
                        {error && <div className="auth-error">{error}</div>}
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="login-email">Email address</label>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="you@company.com"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="password-wrapper">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading && <span className="spinner" />}
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
