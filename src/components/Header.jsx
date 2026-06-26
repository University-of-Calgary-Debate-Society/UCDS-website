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

  const isVoidPage = location.pathname.startsWith('/void');

  if (isVoidPage) {
    return (
      <header className={`site-header void-header ${isOpen ? 'nav-open' : ''}`} style={{
        background: '#000000',
        borderBottom: '2px solid #39ff14',
        padding: '0.75rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
      }}>
        <div className="container header-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link className="brand" to="/void" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#ffffff' }}>
            <span style={{ color: '#39ff14', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '0.15em' }}>&gt; UCDS_VOID</span>
          </Link>
          <button 
            className={`menu-toggle ${isOpen ? 'active' : ''}`} 
            aria-label="Toggle navigation"
            onClick={toggleMenu}
            style={{
              background: 'none',
              border: 'none',
              color: '#39ff14',
              cursor: 'pointer'
            }}
          >
            <span className="hamburger" style={{ background: '#39ff14' }}></span>
          </button>
          <nav className={`site-nav ${isOpen ? 'active' : ''}`} style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <Link to="/" onClick={closeMenu} style={{
              color: '#000000',
              background: '#ffffff',
              border: '1px solid #ffffff',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.35rem 0.95rem',
              borderRadius: '4px',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              boxShadow: '0 0 8px rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#39ff14'; e.currentTarget.style.borderColor = '#39ff14'; e.currentTarget.style.boxShadow = '0 0 12px rgba(57, 255, 20, 0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#ffffff'; e.currentTarget.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.2)'; }}
            >
              Exit Void
            </Link>
          </nav>
        </div>
      </header>
    );
  }

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
