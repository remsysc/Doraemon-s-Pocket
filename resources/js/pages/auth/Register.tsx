import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { register, type ValidationErrorResponse } from "../../lib/api";
import "../../../css/auth.css";

const ROLE_DESCRIPTIONS: Record<string, string> = {
    admin: "Full system access — manage everything",
    purchasing_manager: "View-only access — monitor inventory metrics",
    warehouse_staff: "Manage lots and record stock movements",
};

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "warehouse_staff" as
            | "admin"
            | "purchasing_manager"
            | "warehouse_staff",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (
            !form.name ||
            !form.email ||
            !form.password ||
            !form.password_confirmation
        ) {
            setError("Please complete all fields.");
            return;
        }

        if (form.password !== form.password_confirmation) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await register(form);
            navigate("/login");
        } catch (err) {
            if (err instanceof AxiosError && err.response?.status === 422) {
                const data = err.response.data as ValidationErrorResponse;
                const firstError = Object.values(data.errors)[0]?.[0];
                setError(firstError ?? "Registration failed.");
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
                    <h1 className="auth-brand__title">Join your team</h1>
                    <p className="auth-brand__tagline">
                        Set up your account and start managing inventory together
                    </p>
                    <ul className="auth-brand__features">
                        <li className="auth-brand__feature">
                            <span className="auth-brand__feature-icon">👤</span>
                            Choose a role matching your responsibilities
                        </li>
                        <li className="auth-brand__feature">
                            <span className="auth-brand__feature-icon">🔄</span>
                            Collaborate with your warehouse team
                        </li>
                        <li className="auth-brand__feature">
                            <span className="auth-brand__feature-icon">📊</span>
                            Get real-time visibility into stock levels
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="auth-form-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">⚡</div>
                        <h1>Create Account</h1>
                        <p>Power Outage Monitoring System</p>
                    </div>

                    <div aria-live="polite">
                        {error && <div className="auth-error">{error}</div>}
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="reg-name">Full Name</label>
                            <div className="input-icon-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    id="reg-name"
                                    type="text"
                                    name="name"
                                    placeholder="Juan Dela Cruz"
                                    value={form.name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-email">Email</label>
                            <div className="input-icon-wrapper">
                                <span className="input-icon">✉</span>
                                <input
                                    id="reg-email"
                                    type="email"
                                    name="email"
                                    placeholder="example@email.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-role">Role</label>
                            <select
                                id="reg-role"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                            >
                                <option value="warehouse_staff">
                                    Warehouse Staff
                                </option>
                                <option value="purchasing_manager">
                                    Purchasing Manager
                                </option>
                                <option value="admin">Admin</option>
                            </select>
                            <div className="role-helper">
                                <strong>{form.role.replace("_", " ")}:</strong>{" "}
                                {ROLE_DESCRIPTIONS[form.role]}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-password">Password</label>
                            <div className="password-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Create a password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
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

                        <div className="form-group">
                            <label htmlFor="reg-confirm">Confirm Password</label>
                            <div className="password-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    id="reg-confirm"
                                    type={showConfirm ? "text" : "password"}
                                    name="password_confirmation"
                                    placeholder="Confirm your password"
                                    value={form.password_confirmation}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    {showConfirm ? "🙈" : "👁"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading && <span className="spinner" />}
                            {loading ? "Creating Account…" : "Create Account"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{" "}
                        <Link to="/login">Sign In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
