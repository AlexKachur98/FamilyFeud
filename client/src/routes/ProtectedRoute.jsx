import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const ProtectedRoute = () => {
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

    return <Outlet />;
};

export default ProtectedRoute;
