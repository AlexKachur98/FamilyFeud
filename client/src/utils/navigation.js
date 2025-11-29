/**
 * @file navigation.js
 * @author Alex Kachur
 * @since 2025-11-02
 * @purpose Centralizes navigation and menu metadata shared across the UI.
 */
export const HOME_NAV_ITEM = {
    path: '/',
    label: 'Home',
    description: 'Temporary landing screen with quick access to play and sign in.',
    cardTitle: 'Home Overview',
    cardBody: 'Return to the main landing hub for quick actions.',
};

export const NAV_USER_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    description: 'Control surface for hosts with quick stats and active sessions.',
  },
  {
    path: '/sessions',
    label: 'Sessions',
    description: 'Monitor in-progress games, manage teams, and launch rounds.',
  },
  {
    path: '/leaderboard',
    label: 'Leaderboard',
    description: 'View the rankings of all teams.',
  },
  {
    path: '/question-sets',
    label: 'Question Sets',
    description: 'Create, edit, and curate survey banks for upcoming matches.',
  },
  {
    path: "/profile",
    label: "Profile",
    description: "View and update account details.",
  }
];

export const NAV_ADMIN_ITEMS = [
  {
    path: '/accounts',
    label: 'Accounts',
    description: 'Manage user accounts for Family Feud.',
  },
  {
    path: '/questions',
    label: 'Questions',
    description: 'Manage survey questions for Family Feud rounds.',
  },
  {
    path: '/join/0',
    label: 'Player Join',
    description: 'Entry point for contestants to join matches using an access code.',
  },
  {
    path: '/game-board/0',
    label: 'Game Board',
    description: 'Preview the live board layout with placeholder slots.',
  }
];

export const AUTH_NAV_ITEMS = [
    {
        path: '/signin',
        label: 'Sign In',
        description: 'Authenticate as host or producer to manage game content.',
    },
    {
        path: '/signup',
        label: 'Register',
        description: 'Provision a new host account with role-based permissions.',
    },
];

export const PRIMARY_AUTH_NAV_LINKS = [HOME_NAV_ITEM, ...AUTH_NAV_ITEMS];
export const PRIMARY_USER_NAV_LINKS = [HOME_NAV_ITEM, ...NAV_USER_ITEMS];
export const PRIMARY_ADMIN_NAV_LINKS = [...NAV_ADMIN_ITEMS, ...AUTH_NAV_ITEMS];

/**
 * Returns user-specific navigation items to render as cards on the dashboard.
 * @returns {Array} User dashboard navigation items (excluding the home overview card).
 */
export function getUserDashboardCards() {
    return NAV_USER_ITEMS;
}

/**
 * Returns authentication related cards for the home landing page.
 * @returns {Array} auth menu card configuration.
 */
export function getAuthCards() {
    return AUTH_NAV_ITEMS;
}
