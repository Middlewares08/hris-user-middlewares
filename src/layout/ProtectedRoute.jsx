import { Navigate, useLocation } from "react-router-dom";
import { useAuthUser } from "../hooks/useAuthUser";
import Loading from "../components/Loading";
import { can } from "../utils/permissionCheck";

// Every employee who may use the PWA carries this. Missing = account is admin-only.
const PORTAL_ACCESS = "employee-portal:access";

const NoAccess = ({ title, message }) => (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-sm text-center space-y-2">
            <h1 className="text-lg font-bold text-slate-800">{title}</h1>
            <p className="text-sm text-slate-500">{message}</p>
            <a href="/home" className="inline-block mt-3 text-sm font-semibold text-indigo-600">Back to home</a>
        </div>
    </div>
);

const ProtectedRoute = ({ children, permission, requireAll = false }) => {
    const location = useLocation();
    const token = localStorage.getItem("accessToken");

    // Bootstraps /auth/me — this also refreshes the stored permission set.
    const { data: authUser, isLoading, isError } = useAuthUser();

    if (!token || isError) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (isLoading || !authUser) {
        return <Loading size="lg" text='BradSmart' fullPage={true} />;
    }

    // App-level gate: the account must be allowed into the employee portal at all.
    if (!can(PORTAL_ACCESS)) {
        return (
            <NoAccess
                title="No employee portal access"
                message="This account isn't set up to use the employee app. Contact HR if you think this is a mistake."
            />
        );
    }

    // Route-level gate.
    if (permission && !can(permission, requireAll)) {
        return (
            <NoAccess
                title="You don't have access to this"
                message="Your role doesn't include this section. Contact HR if you need it."
            />
        );
    }

    return children;
};

export default ProtectedRoute;
