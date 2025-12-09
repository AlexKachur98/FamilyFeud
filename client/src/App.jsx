/**
 * @file App.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Hosts the Family Feud routing structure and shared layout.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { useAuth } from './components/auth/AuthContext.js';

import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import SignedOut from './pages/SignedOut.jsx';

import Home from './pages/Home.jsx';
import Accounts from './pages/Accounts.jsx';
import Questions from './pages/Questions.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import UserProfile from './pages/UserProfile.jsx';
import GameLobby from './pages/GameLobby.jsx';
import GameBoard from './pages/GameBoard.jsx';
import PlayerView from './pages/PlayerView.jsx';

import NotFound from './pages/NotFound.jsx';
import UnderConstruction from './pages/UnderConstruction.jsx';

import ProtectedRoute from './routes/ProtectedRoute.jsx';
import ProtectedAdminRoute from './routes/ProtectedAdminRoute.jsx';
import Sidebar from './components/Sidebar.jsx';

export default function App() {
  
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        
        <Route element={<Sidebar />}>

            {/* Public Group - Auth pages only */}
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="signed-out" element={<SignedOut />} />

            {/* Protected Group - User */}
            <Route element={<ProtectedRoute />} >
              <Route path="lobby" element={<GameLobby />} />
              <Route path="lobby/:sessionId" element={<GameLobby />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="game-board" element={<GameBoard />} />
              <Route path="player-view" element={<PlayerView />} />
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
