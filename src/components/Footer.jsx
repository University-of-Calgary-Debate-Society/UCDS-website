import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

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
