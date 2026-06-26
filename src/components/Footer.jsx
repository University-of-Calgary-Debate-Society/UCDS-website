import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const isVoidPage = location.pathname.startsWith('/void');

  if (isVoidPage) {
    return (
      <footer className="void-footer" style={{
        background: '#000000',
        borderTop: '2px solid #39ff14',
        padding: '1.5rem 0',
        color: '#ffffff',
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '0.85rem'
      }}>
        <div className="container footer-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ margin: 0, color: '#888888' }}>
            &copy; {currentYear} UCDS_VOID. All rights reserved. | <Link to="/executive" style={{ color: '#39ff14', textDecoration: 'none' }}>[ Executive Portal ]</Link>
          </p>
          <div className="footer-socials" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#39ff14' }}>&gt; Connect:</span>
            <a href="https://discord.gg/5TAG3c8TwC" target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#39ff14'} onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}>[ Discord ]</a>
            <a href="https://www.instagram.com/ucalgary.debate/" target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#39ff14'} onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}>[ Instagram ]</a>
            <a href="https://www.facebook.com/DebateUofC/" target="_blank" rel="noreferrer" style={{ color: '#ffffff', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#39ff14'} onMouseLeave={e => e.currentTarget.style.color = '#ffffff'}>[ Facebook ]</a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>&copy; {currentYear} UCDS. All rights reserved. | <Link to="/executive" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Executive Portal</Link></p>
        <div className="footer-socials">
          <a href="https://www.instagram.com/ucalgary.debate/" target="_blank" rel="noreferrer" aria-label="Instagram">
            <img src="/photos/instagram_footer.png" alt="Instagram" className="footer-social-icon" />
          </a>
          <a href="https://www.facebook.com/DebateUofC/" target="_blank" rel="noreferrer" aria-label="Facebook">
            <img src="/photos/facebook_footer.png" alt="Facebook" className="footer-social-icon" />
          </a>
          <a href="https://linktr.ee/ucds.debate" target="_blank" rel="noreferrer" aria-label="Linktree">
            <img src="/photos/linktree_footer.png" alt="Linktree" className="footer-social-icon" />
          </a>
          <a href="https://x.com/UCDebate" target="_blank" rel="noreferrer" aria-label="X (Twitter)">
            <img src="/photos/x_footer.png" alt="X (Twitter)" className="footer-social-icon" />
          </a>
          <a href="https://discord.gg/5TAG3c8TwC" target="_blank" rel="noreferrer" aria-label="Discord">
            <img src="/photos/discord_footer.png" alt="Discord" className="footer-social-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
}
