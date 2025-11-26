import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const ProtectedRoute = () => {
    const { isLoading, user } = useAuth();

    if (!isLoading) {
        // If no user is logged in, redirect to sign-in
        if (!user) return <Navigate to="/" replace />;
        
        return <Outlet />;
    }
};

export default ProtectedRoute;