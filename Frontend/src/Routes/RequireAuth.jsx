import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/useAuth";

export default function RequireAuth({ children }) {
  const { user, loading, restoreError, retrySession } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center px-4 text-sm font-medium text-slate-600" role="status">
        Checking your session…
      </div>
    );
  }

  if (restoreError) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Unable to verify your session</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{restoreError}</p>
        <button
          type="button"
          onClick={retrySession}
          className="mt-6 rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
