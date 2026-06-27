import { Link } from 'react-router-dom';

export default function HelpThanks() {
  return (
    <main className="help-thanks-page" style={{ background: '#0b1a3a', color: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '2rem' }}>
      
      {/* Decorative glows */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div className="container" style={{ maxWidth: '500px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(17, 40, 84, 0.45)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}>
          {/* Success Checkmark Icon */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '2px solid #10b981',
            color: '#34d399',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '2rem'
          }}>
            ✓
          </div>

          <h1 style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem', color: '#ffffff' }}>
            Registration Submitted!
          </h1>
          
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.6', margin: '0 0 2.5rem' }}>
            Thank you for taking the time to respond and registering as an Independent Adjudicator. Your details have been successfully saved, and you have been added to our official adjudicator registry.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to="/events/hosted-tournaments"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '0.85rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.3s'
              }}
            >
              Back to Hosted Tournaments
            </Link>
            <Link
              to="/"
              style={{
                color: '#94a3b8',
                textDecoration: 'none',
                padding: '0.85rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
