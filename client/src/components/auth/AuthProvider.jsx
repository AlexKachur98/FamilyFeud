
import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

import { apiFetch } from '../../utils/api';

export default function AuthProvider({ children }) {
  const
    [isLoggedIn, setIsLoggedIn] = useState(false),
    [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await apiFetch('/api/v1/auth/validate');

        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          setUser(data.user);
        }
        else {
          setIsLoggedIn(false);
          setUser(null);
        };
      }
      catch (e) {
        console.error('Session check failed:', e);
        setIsLoggedIn(false);
        setUser(null);
      };
    };
    checkSession();
  }, []);

  const signIn = async (email, password) => {
    try {
      const res = await apiFetch('/api/v1/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        return { success: false, message: 'Login res failed' };
      }

      const data = await res.json();

      setIsLoggedIn(true);
      setUser(data.user);

      return { success: true };
    }
    catch (e) {
      console.error('Login error:', e);
      return { success: false, message: e.message };
    };
  };

  const signUp = async (name, email, password) => {
    try {
      const res = await apiFetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        const e = await res.json();
        return { success: false, message: e.message };
      };

      const data = await res.json();
      setIsLoggedIn(true);
      setUser(data.user);

      return { success: true };
    }
    catch (e) {
      return { success: false, message: e.message };
    };
  };

  const signOut = async () => {
    try {
      await apiFetch('/api/v1/auth/signout', {
        method: 'GET'
      });

      setIsLoggedIn(false);
      setUser(null);
      return { success: true };
    }
    catch (e) {
      console.error('Logout error:', e);
      return { success: false, message: e.message };
    };
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
