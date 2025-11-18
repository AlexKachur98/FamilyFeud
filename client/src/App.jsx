/**
 * @file App.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Hosts the Family Feud routing structure and shared layout.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './components/auth/AuthProvider.jsx';

import Layout from './components/Layout.jsx';

import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';

import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import QuestionSets from './pages/QuestionSets.jsx';
import SessionCreate from './pages/SessionCreate.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import GameBoard from './pages/GameBoard.jsx';
import Lobby from './pages/Lobby.jsx';
import UserProfile from './pages/UserProfile.jsx';

import NotFound from './pages/NotFound.jsx';
import UnderConstruction from './pages/UnderConstruction.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';

export default function App() {
  // TODO: Swap Router alias back to BrowserRouter once the server serves index.html for deep links.
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="question-sets" element={<ProtectedRoute><QuestionSets /></ProtectedRoute>} />
            <Route path="/game-board" element={<ProtectedRoute><GameBoard /></ProtectedRoute>} />
            <Route path="lobby/:sessionId" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
            <Route path="session-create" element={<ProtectedRoute><SessionCreate /></ProtectedRoute>} />
            <Route path="leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="under-construction" element={<UnderConstruction />} />
            <Route path="profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
