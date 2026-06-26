import { Link } from 'react-router-dom';

export default function DiscordInstall() {
  const installUrl = "https://discord.com/oauth2/authorize?client_id=1519844943571456041&permissions=60416&integration_type=0&scope=bot";

  return (
    <main>
      <section className="section" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', padding: '4rem 1rem' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'rgba(17, 40, 84, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '1.5rem',
            padding: '3.5rem 2.5rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center'
          }}>
            {/* Pulsing sky-blue backdrop glow */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: '-50px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: '#5865f2',
              filter: 'blur(70px)',
              opacity: 0.18,
              pointerEvents: 'none'
            }}></div>

            {/* Pulsing Status Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '0.4rem 1rem', borderRadius: '999px', marginBottom: '1.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }}></span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bot Online</span>
            </div>

            {/* Stylized Avatar Illustration */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {/* UCDS Logo mock avatar */}
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.15)', overflow: 'hidden', background: '#0a192f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/photos/logo.jpg" alt="UCDS Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* Connection Symbol */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/></svg>
              {/* Discord Logo Mock Avatar */}
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #5865F2', background: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 25px rgba(88, 101, 242, 0.3)' }}>
                <svg width="36" height="36" viewBox="0 0 127.14 96.36" fill="#ffffff">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.95,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36c2.69-3.66,5-7.58,7-11.69a68.4,68.4,0,0,1-10.63-5.12c.9-.66,1.76-1.37,2.58-2.1a75.7,75.7,0,0,0,72.3,0c.82.73,1.68,1.44,2.58,2.1a68.86,68.86,0,0,1-10.63,5.12c2,4.11,4.35,8,7,11.69a105.3,105.3,0,0,0,30.62-18.83C129.84,48.24,124.05,25.45,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
              </div>
            </div>

            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 1rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Invite Announcement Bot
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', margin: '0 auto 2.5rem', maxWidth: '480px' }}>
              Bridge the UCDS portal and your Discord community. Authorize this bot to automatically receive real-time notifications, training schedules, and society announcements in a channel of your choice.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <a href={installUrl} target="_blank" rel="noreferrer" style={{
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                maxWidth: '320px',
                padding: '1rem 2rem',
                background: '#5865F2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                fontSize: '1.1rem',
                fontWeight: 750,
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(88, 101, 242, 0.4)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4752c4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.transform = 'none'; }}>
                <svg width="22" height="22" viewBox="0 0 127.14 96.36" fill="#ffffff" style={{ objectFit: 'contain' }}>
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.95,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36c2.69-3.66,5-7.58,7-11.69a68.4,68.4,0,0,1-10.63-5.12c.9-.66,1.76-1.37,2.58-2.1a75.7,75.7,0,0,0,72.3,0c.82.73,1.68,1.44,2.58,2.1a68.86,68.86,0,0,1-10.63,5.12c2,4.11,4.35,8,7,11.69a105.3,105.3,0,0,0,30.62-18.83C129.84,48.24,124.05,25.45,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
                <span>Authorize Bot</span>
              </a>

              <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.25rem', fontSize: '0.9rem' }}>
                <Link to="/void/discord/terms-and-privacy" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
                  Terms & Privacy
                </Link>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>•</span>
                <Link to="/void" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
                  Exit to Void
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.6;
          }
        }
      `}</style>
    </main>
  );
}
