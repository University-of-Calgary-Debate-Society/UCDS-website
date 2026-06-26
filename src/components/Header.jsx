import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className={`site-header ${isOpen ? 'nav-open' : ''}`}>
      <div className="container header-inner">
        <Link className="brand" to="/" onClick={closeMenu}>
          <img src="/photos/logo.jpg" alt="University of Calgary Debate Society logo" className="logo-image" />
          <span className="brand-text desktop-only">University of Calgary Debate Society</span>
          <span className="brand-text mobile-only">UCDS</span>
        </Link>
        <button 
          className={`menu-toggle ${isOpen ? 'active' : ''}`} 
          aria-label="Toggle navigation"
          onClick={toggleMenu}
        >
          <span className="hamburger"></span>
        </button>
        <nav className={`site-nav ${isOpen ? 'active' : ''}`}>
          <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
          <div className="nav-dropdown-wrapper">
            <NavLink to="/events" className="nav-dropdown-trigger" onClick={closeMenu}>Events</NavLink>
            <div className="nav-dropdown-menu">
              <Link to="/events" onClick={closeMenu}>Overview</Link>
              <Link to="/calendar" onClick={closeMenu}>Interactive Calendar</Link>
              <Link to="/events/calgary-summer-cup" onClick={closeMenu}>Summer Cup</Link>
            </div>
          </div>
          <NavLink to="/blog" onClick={closeMenu}>Blog</NavLink>
          <NavLink to="/resources" onClick={closeMenu}>Resources</NavLink>
          <div className="nav-dropdown-wrapper">
            <NavLink to="/connect" className="nav-dropdown-trigger" onClick={closeMenu}>Connect</NavLink>
            <div className="nav-dropdown-menu">
              <Link to="/connect" onClick={closeMenu}>Exec Team</Link>
              <Link to="/socials" onClick={closeMenu}>Social Feed</Link>
            </div>
          </div>
          <NavLink to="/join" className="nav-join-button" onClick={closeMenu}>Join</NavLink>
        </nav>
      </div>
    </header>
  );
}
