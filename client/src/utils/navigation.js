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
    path: '/leaderboard',
    label: 'Leaderboard',
    description: 'View the rankings of all teams.',
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
  }
];

export const NAV_PUBLIC_ITEMS = [
  {
    path: '/lobby',
    label: 'Play Game',
    description: 'Join or host a Family Feud game session.',
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

export const PRIMARY_AUTH_NAV_LINKS = [HOME_NAV_ITEM, ...NAV_PUBLIC_ITEMS, ...AUTH_NAV_ITEMS];
export const PRIMARY_USER_NAV_LINKS = [HOME_NAV_ITEM, ...NAV_PUBLIC_ITEMS, ...NAV_USER_ITEMS];
export const PRIMARY_ADMIN_NAV_LINKS = [...NAV_ADMIN_ITEMS];

/**
 * Returns user-specific navigation items.
 * @returns {Array} User navigation items.
 */
export function getUserNavCards() {
    return NAV_USER_ITEMS;
}

/**
 * Returns authentication related cards for the home landing page.
 * @returns {Array} auth menu card configuration.
 */
export function getAuthCards() {
    return AUTH_NAV_ITEMS;
}
