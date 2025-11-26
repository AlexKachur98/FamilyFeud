/**
 * @file App.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Hosts the Family Feud routing structure and shared layout.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { useAuth } from './components/auth/AuthContext.js';

import Layout from './components/Layout.jsx';

import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import SignedOut from './pages/SignedOut.jsx';

import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Accounts from './pages/Accounts.jsx';
import Questions from './pages/Questions.jsx';
import QuestionSets from './pages/QuestionSets.jsx';
import Sessions from './pages/Sessions.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import PlayerJoin from './pages/PlayerJoin.jsx';
import GameBoard from './pages/GameBoard.jsx';
import UserProfile from './pages/UserProfile.jsx';

import NotFound from './pages/NotFound.jsx';
import UnderConstruction from './pages/UnderConstruction.jsx';

import ProtectedRoute from './routes/ProtectedRoute.jsx';
import ProtectedAdminRoute from './routes/ProtectedAdminRoute.jsx';

export default function App() {
  
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>

          {/* Public Group */}
          <Route index element={<Home />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="signed-out" element={<SignedOut />} />

          {/* Protected Group - User */}
          <Route element={<ProtectedRoute />} >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="question-sets" element={<QuestionSets />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="player" element={<PlayerJoin />} />
            <Route path="/game-board" element={<GameBoard />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="under-construction" element={<UnderConstruction />} />
          </Route>

          {/* Protected Group - Admin */}
          <Route element={<ProtectedAdminRoute />} >
            <Route path="accounts" element={<Accounts />} />
            <Route path="questions" element={<Questions />} />
          </Route>

          {/* any other path -> if authenticated go to Home, otherwise redirect to /login */}
          <Route path="*" element={user ? <NotFound /> : <Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
