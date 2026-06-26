import { Link } from 'react-router-dom';

export default function Matter() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '3rem' }}>
            <h1>Matter Files</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginTop: '1rem', maxWidth: '600px', marginInline: 'auto' }}>
              Subject briefs, case libraries, and topic guides to build a strong background knowledge base for impromptu debates.
            </p>
          </div>

          <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>International Relations Briefing</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  A detailed summary of global alliances, conflict zones, trade treaties, security networks, and key foreign policy theories (Realism vs. Liberalism).
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Economics & Finance Cases</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Core economic mechanisms explained: central banking, inflation control, fiscal stimulus, carbon pricing, trade tariffs, and gig economy regulations.
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Social Justice & Law Files</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Guides on legal philosophy, criminal justice reforms, civil rights history, intellectual property disputes, and identity politics debates.
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>
          </div>

          <div style={{ marginTop: '4rem', textAlign: 'center' }}>
            <Link to="/resources" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
              ← Back to Resources Overview
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
