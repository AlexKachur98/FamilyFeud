import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const ProtectedAdminRoute = () => {
    const { isLoading, user } = useAuth();

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '50vh'
            }}>
                <p>Loading...</p>
            </div>
        );
    }

    // If no user is logged in, redirect to sign-in
    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    // If the route is admin-only and the user is not an admin, redirect to leaderboard
    if (!user.admin) {
        return <Navigate to="/leaderboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedAdminRoute;
