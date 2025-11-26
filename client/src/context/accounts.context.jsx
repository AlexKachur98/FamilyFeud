// accounts.context.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

import { getAllUsers } from "../api/users.api";
import { useAuth } from "../components/auth/AuthContext";

// Context
const AccountsContext = createContext();

// Provider
export const AccountsProvider = ({ children }) => {

    const { user } = useAuth();

    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const accountsData = await getAllUsers();
            setUsers(accountsData);
            setIsLoadingAccounts(false);
        }
        if (user?.admin) fetchData();
    }, [user]);

    return (
        <AccountsContext.Provider value={{ isLoadingAccounts, users, setUsers }}>
            {children}
        </AccountsContext.Provider>
    );
};

// Custom hook for convenience
export const useAccounts = () => useContext(AccountsContext);