import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-slate-100">
                    <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center text-2xl font-bold">
                            !
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {this.props.fallbackTitle ?? "Something went wrong"}
                        </h2>
                        <p className="text-sm text-slate-300">
                            An unexpected error occurred while rendering this view.
                        </p>
                        {this.state.error?.message && (
                            <div className="bg-slate-950 p-3 rounded text-left font-mono text-xs text-red-400 overflow-x-auto">
                                {this.state.error.message}
                            </div>
                        )}
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Reload Page
                            </button>
                            <a
                                href="/dashboard"
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Return to Dashboard
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
