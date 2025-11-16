
import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { auth } from '../../utils/api';


export default function AuthProvider({ children }) {
  const
    [isLoggedIn, setIsLoggedIn] = useState(false),
    [user, setUser] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const
          res = await auth.validate(),
          data = await res.json();

        setIsLoggedIn(data.valid);
        setUser(data.user);
      }
      catch (e) {
        // console.error('Session check failed:', e);
        setIsLoggedIn(false);
        setUser(null);
      };
    };
    checkSession();
  }, []);

  const signIn = async (email, password) => {
    try {
      const res = await auth.signin(email, password);

      if (!res.ok) return { success: false, message: 'Login failed' };

      const data = await res.json();

      setIsLoggedIn(true);
      setUser(data.user);

      return { success: true };
    }
    catch (e) {
      // console.error('Login error:', e);
      return { success: false, message: e.message };
    };
  };

  const signUp = async (username, email, password) => {
    try {
      const res = await auth.signup(username, email, password);

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
      await auth.signout();

      setIsLoggedIn(false);
      setUser(null);
      return { success: true };
    }
    catch (e) {
      // console.error('Logout error:', e);
      return { success: false, message: e.message };
    };
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
