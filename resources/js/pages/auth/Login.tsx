import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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
            {/* Left Brand Panel */}
            <div className="auth-brand">
                <div className="auth-brand__content">
                    <div className="auth-brand__logo">⚡</div>
                    <h1 className="auth-brand__title">WalangBrownout</h1>
                    <p className="auth-brand__tagline">
                        Inventory management built for reliability
                    </p>
                    <ul className="auth-brand__features">
                        <li className="auth-brand__feature">
                            <span className="auth-brand__feature-icon">📦</span>
                            Real-time inventory tracking
                        </li>
                        <li className="auth-brand__feature">
                            <span className="auth-brand__feature-icon">🔐</span>
                            Role-based access control
                        </li>
                        <li className="auth-brand__feature">
                            <span className="auth-brand__feature-icon">📋</span>
                            Audit trail for compliance
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">⚡</div>
                        <h1>Welcome back</h1>
                        <p>Sign in to your inventory account</p>
                    </div>

                    <div aria-live="polite">
                        {error && <div className="auth-error">{error}</div>}
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="login-email">Email Address</label>
                            <div className="input-icon-wrapper">
                                <span className="input-icon">✉</span>
                                <input
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="password-wrapper">
                                <span className="input-icon">🔒</span>
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
                                    {showPassword ? "🙈" : "👁"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading && <span className="spinner" />}
                            {loading ? "Signing In…" : "Sign In"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account?{" "}
                        <Link to="/register">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
