import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import {
    login,
    type LoginPayload,
    type ValidationErrorResponse,
} from "../../lib/api";
import AnimatedCityscape from "../../components/AnimatedCityscape";
import "../../../css/auth.css";
import "../../../css/cityscape.css";

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
            <div className="auth-page__scene">
                <AnimatedCityscape />
            </div>
            <div className="auth-page__form-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-header__brand">WalangBrownout</h2>
                        <p className="auth-header__system">Supply Chain & Distribution</p>
                        <h1>Sign in</h1>
                        <p>Enter your credentials to continue</p>
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

                    <div className="auth-footer">
                        Don't have an account?{" "}
                        <Link to="/register">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
