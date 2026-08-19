import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { register, type ValidationErrorResponse } from "../../lib/api";
import AnimatedCityscape from "../../components/AnimatedCityscape";
import "../../../css/auth.css";
import "../../../css/cityscape.css";

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
            <div className="auth-page__scene">
                <AnimatedCityscape />
            </div>
            <div className="auth-page__form-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-header__brand">WalangBrownout</h2>
                        <p className="auth-header__system">Absolute comfort, perfectly preserved.</p>
                        <h1>Create account</h1>
                        <p>Set up your credentials to get started</p>
                    </div>

                    <div aria-live="polite">
                        {error && <div className="auth-error">{error}</div>}
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="reg-name">Full name</label>
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

                        <div className="form-group">
                            <label htmlFor="reg-email">Email address</label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                placeholder="you@company.com"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-role">Role</label>
                            <select
                                id="reg-role"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                            >
                                <option value="warehouse_staff">Warehouse Staff</option>
                                <option value="purchasing_manager">Purchasing Manager</option>
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
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-confirm">Confirm password</label>
                            <div className="password-wrapper">
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
                                    {showConfirm ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading && <span className="spinner" />}
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
