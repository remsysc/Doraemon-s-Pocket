import axios, { type AxiosInstance } from "axios";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: "admin" | "purchasing_manager" | "warehouse_staff";
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

/** Laravel's validation error response shape (422). */
export interface ValidationErrorResponse {
    message: string;
    errors: Record<string, string[]>;
}

const api: AxiosInstance = axios.create({
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});

/**
 * Sanctum's SPA cookie auth requires this to be hit before any
 * state-changing request (POST/PUT/DELETE). It sets the XSRF-TOKEN
 * cookie, which axios then reads automatically and attaches as the
 * X-XSRF-TOKEN header on every request after this.
 */
function getCsrfCookie() {
    return api.get("/sanctum/csrf-cookie");
}

export async function login(payload: LoginPayload) {
    await getCsrfCookie();
    return api.post<AuthUser>("/api/login", payload);
}

export async function register(payload: RegisterPayload) {
    await getCsrfCookie();
    return api.post<AuthUser>("/api/register", payload);
}

export function logout() {
    return api.post("/api/logout");
}

export function getCurrentUser() {
    return api.get<AuthUser>("/api/user");
}

export default api;
