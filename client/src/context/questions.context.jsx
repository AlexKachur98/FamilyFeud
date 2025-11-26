// DataContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

import { getQuestions } from "../api/questions.api";
import { useAuth } from "../components/auth/AuthContext";

// Context
const QuestionsContext = createContext();

// Provider
export const QuestionsProvider = ({ children }) => {

    const { user } = useAuth();

    const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const questionsData = await getQuestions();
            setQuestions(questionsData);
            setIsLoadingQuestions(false);
        }
        if (user?.admin) fetchData();
    }, [user]);

    return (
        <QuestionsContext.Provider value={{ isLoadingQuestions, questions, setQuestions }}>
            {children}
        </QuestionsContext.Provider>
    );
};

// Custom hook for convenience
export const useQuestions = () => useContext(QuestionsContext);