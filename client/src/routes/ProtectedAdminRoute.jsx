import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const ProtectedAdminRoute = () => {
    const { isLoading, user } = useAuth();

    if (!isLoading) {
        // If no user is logged in, redirect to sign-in
        if (!user) return <Navigate to="/" replace />;
    
        // If the route is admin-only and the user is not an admin, redirect to dashboard
        if (!user.admin) return <Navigate to="/dashboard" replace />;
        
        return <Outlet />;
    }

};

export default ProtectedAdminRoute;