/**
 * @file App.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Hosts the Family Feud routing structure and shared layout.
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AuthProvider from './components/auth/AuthProvider.jsx';

import Layout from './components/Layout.jsx';

import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import SignedOut from './pages/SignedOut.jsx';

import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import QuestionSets from './pages/QuestionSets.jsx';
import Sessions from './pages/Sessions.jsx';
import PlayerJoin from './pages/PlayerJoin.jsx';
import GameBoard from './pages/GameBoard.jsx';

import NotFound from './pages/NotFound.jsx';
import UnderConstruction from './pages/UnderConstruction.jsx';

export default function App() {
  // TODO: Swap Router alias back to BrowserRouter once the server serves index.html for deep links.
  return (

    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="question-sets" element={<QuestionSets />} />
            <Route path="/game-board" element={<GameBoard />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="player" element={<PlayerJoin />} />
            <Route path="signin" element={<SignIn />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="under-construction" element={<UnderConstruction />} />
            <Route path="signed-out" element={<SignedOut />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};
