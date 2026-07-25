import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { register, type ValidationErrorResponse } from "../../lib/api";
import "../../../css/auth.css";

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        role: "warehouse_staff" as
            "admin" | "purchasing_manager" | "warehouse_staff",
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
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">⚡</div>
                    <h1>Create Account</h1>
                    <p>Power Outage Monitoring System</p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Juan Dela Cruz"
                            value={form.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="example@email.com"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select
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
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirm ? "text" : "password"}
                                name="password_confirmation"
                                value={form.password_confirmation}
                                onChange={handleChange}
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowConfirm(!showConfirm)}
                            >
                                {showConfirm ? "🙈" : "👁"}
                            </button>
                        </div>
                    </div>

                    <button className="auth-button" disabled={loading}>
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
