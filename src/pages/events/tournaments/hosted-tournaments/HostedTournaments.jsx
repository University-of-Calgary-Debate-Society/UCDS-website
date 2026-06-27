import { Link } from 'react-router-dom';

export default function HostedTournaments() {
  return (
    <main className="hosted-tournaments-page" style={{ background: '#0b1a3a', color: '#ffffff', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background radial glows */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <section className="section" style={{ position: 'relative', zIndex: 1, padding: '6rem 0' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          
          {/* Header Title */}
          <div className="section-header straddle" style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h1 className="animate-on-scroll fade-in-left" style={{ fontFamily: 'Outfit, Inter, sans-serif', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, margin: '0 0 1rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Hosted Tournaments
            </h1>
            <p className="animate-on-scroll fade-in" style={{ color: '#94a3b8', fontSize: '1.15rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              The University of Calgary Debate Society has a proud history of hosting premier regional, national, and open tournaments. Browse our upcoming events below.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '2.5rem' }}>
            
            {/* Active Tournament Card: Calgary Summer Cup */}
            <article className="card animate-on-scroll lift-out-shadow" style={{
              background: 'linear-gradient(145deg, rgba(17, 40, 84, 0.6) 0%, rgba(13, 27, 56, 0.8) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '1.5rem',
              padding: '2.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.4s ease'
            }}>
              {/* Active Badge */}
              <div style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                padding: '0.4rem 1.2rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Active Registration
              </div>

              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem', color: '#ffffff', borderBottom: 'none', paddingBottom: 0 }}>
                Calgary Summer Cup 2026
              </h2>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', margin: '1rem 0 1.5rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                <div>📅 <strong>Date:</strong> July 25-26, 2026</div>
                <div>📍 <strong>Location:</strong> Online (Discord)</div>
                <div>🎙️ <strong>Format:</strong> British Parliamentary (BP)</div>
              </div>

              <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '1.05rem', margin: '0 0 2rem' }}>
                Welcoming junior high and senior high school debaters in grades 6-12 to the Calgary Summer Cup 2026! 
                This tournament offers open adjudication, high-quality debate rounds, and competitive categories for both beginners and open speakers. Join independent adjudicators and top debaters for a weekend of academic excellence.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <Link to="/events/calgary-summer-cup" className="button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontWeight: 600 }}>
                  View Tournament Details &rarr;
                </Link>
                <Link to="/help" className="button button-white" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontWeight: 600, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff' }}>
                  Register as Independent Adjudicator (IA)
                </Link>
              </div>
            </article>

            {/* Inactive Tournament Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              {/* Stub 1: Fall Open Novice Championships */}
              <article className="card animate-on-scroll lift-out-shadow" style={{
                background: 'rgba(17, 40, 84, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '1.5rem',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.85
              }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: '#e2e8f0', borderBottom: 'none', paddingBottom: 0 }}>
                    Fall Open Novice Championships
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', margin: '0.5rem 0 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <span>📅 Autumn 2026</span>
                    <span>•</span>
                    <span>📍 In-Person (UCalgary Campus)</span>
                  </div>
                  <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
                    Our flagship training tournament designed specifically for university novices to gain competitive experience. Offers coaching seminars and constructive adjudication panels.
                  </p>
                </div>
                
                <button disabled style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  width: '100%',
                  cursor: 'not-allowed',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Coming Soon
                </button>
              </article>

              {/* Stub 2: McGoun Cup */}
              <article className="card animate-on-scroll lift-out-shadow" style={{
                background: 'rgba(17, 40, 84, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '1.5rem',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.85
              }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: '#e2e8f0', borderBottom: 'none', paddingBottom: 0 }}>
                    McGoun Cup 2027
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', margin: '0.5rem 0 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <span>📅 Winter 2027</span>
                    <span>•</span>
                    <span>📍 Western Canada region</span>
                  </div>
                  <p style={{ color: '#94a3b8', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
                    The historic regional championship for Western Canadian universities. UCDS is thrilled to welcome top debate institutions to Calgary for this premier circuit event.
                  </p>
                </div>

                <button disabled style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  width: '100%',
                  cursor: 'not-allowed',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Coming Soon
                </button>
              </article>

            </div>

          </div>

        </div>
      </section>
    </main>
  );
}
