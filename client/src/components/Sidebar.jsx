
/**
 * @file Sidebar.jsx
 * @author Pierre Moreau
 * @since 2025-11-26
 * @purpose Sidebar component for navigation and additional options.
*/
import { useState } from "react";
import { Link } from "react-router-dom";

import { PRIMARY_ADMIN_NAV_LINKS, PRIMARY_USER_NAV_LINKS } from "../utils/navigation";
import { useAuth } from "./auth/AuthContext";

export default function Sidebar() {

    const { user } = useAuth();
    
    const [menuOpen, setMenuOpen] = useState(false);
    const toggleMenu = () => setMenuOpen((v) => !v);
    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            <header className="landing-basic__chrome">
                <button
                type="button"
                className="landing-basic__menu"
                aria-label="Open navigation"
                aria-controls="landing-drawer"
                aria-expanded={menuOpen}
                onClick={toggleMenu}
                >
                <span />
                <span />
                <span />
                </button>
            </header>

            {/* Simple slide-out drawer for quick navigation while on the landing view. */}
            {menuOpen ? <button className="landing-basic__backdrop" aria-label="Close menu" onClick={closeMenu} /> : null}
            <nav
                id="landing-drawer"
                className={"landing-basic__drawer" + (menuOpen ? " landing-basic__drawer--open" : "")}
                aria-hidden={!menuOpen}
            >
                <button type="button" className="landing-basic__drawer-close" onClick={closeMenu} aria-label="Close menu">
                    ×
                </button>
                <ul className="landing-basic__drawer-list">
                    {
                        (user?.admin ? PRIMARY_ADMIN_NAV_LINKS : PRIMARY_USER_NAV_LINKS).map(link => (
                            <li key={link.path}>
                            <Link to={link.path} onClick={closeMenu}>
                                {link.label}
                            </Link>
                            </li>
                        ))
                    }
                <li>
                    <button
                        type="button"
                        className="landing-basic__drawer-link landing-basic__drawer-link--button"
                        onClick={() => {
                            closeMenu();
                            navigate('/signed-out');
                        }}
                        >
                        Sign Out
                    </button>
                    </li>
                </ul>
            </nav>
        </>
    );
}
