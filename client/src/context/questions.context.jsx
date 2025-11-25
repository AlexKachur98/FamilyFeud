// DataContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

import { getQuestions } from "../api/questions.api";
import { useAuth } from "../components/auth/AuthContext";

// Context
const QuestionsContext = createContext();

// Provider
export const QuestionsProvider = ({ children }) => {

    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const questionsData = await getQuestions();
            setQuestions(questionsData);
            setIsLoading(false);
        }
        if (user) fetchData();
    }, [user]);

    return (
        <QuestionsContext.Provider value={{ isLoading, questions, setQuestions }}>
            {children}
        </QuestionsContext.Provider>
    );
};

// Custom hook for convenience
export const useQuestions = () => useContext(QuestionsContext);