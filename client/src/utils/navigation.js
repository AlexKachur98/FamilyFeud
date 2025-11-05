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

export const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    description: 'Control surface for hosts with quick stats and active sessions.',
  },
  {
    path: '/question-sets',
    label: 'Question Sets',
    description: 'Create, edit, and curate survey banks for upcoming matches.',
  },
  {
    path: '/sessions',
    label: 'Sessions',
    description: 'Monitor in-progress games, manage teams, and launch rounds.',
  },
  {
    path: '/player',
    label: 'Player Join',
    description: 'Entry point for contestants to join matches using an access code.',
  },
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

export const PRIMARY_NAV_LINKS = [HOME_NAV_ITEM, ...NAV_ITEMS, ...AUTH_NAV_ITEMS];

/**
 * Returns menu entries that should render as cards on the home dashboard.
 * @returns {Array} menu configuration excluding the home overview card.
 */
export function getDashboardCards() {
    return NAV_ITEMS;
}

/**
 * Returns authentication related cards for the home landing page.
 * @returns {Array} auth menu card configuration.
 */
export function getAuthCards() {
    return AUTH_NAV_ITEMS;
}
