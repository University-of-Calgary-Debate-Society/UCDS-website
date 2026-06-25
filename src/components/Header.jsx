import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

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
          <NavLink to="/events" onClick={closeMenu}>Events</NavLink>
          <NavLink to="/blog" onClick={closeMenu}>Blog</NavLink>
          <NavLink to="/resources" onClick={closeMenu}>Resources</NavLink>
          <NavLink to="/connect" onClick={closeMenu}>Connect</NavLink>
          <NavLink to="/join" className="nav-join-button" onClick={closeMenu}>Join</NavLink>
        </nav>
      </div>
    </header>
  );
}
