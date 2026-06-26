import { Link } from 'react-router-dom';

export default function External() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '3rem' }}>
            <h1>External Links</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginTop: '1rem', maxWidth: '600px', marginInline: 'auto' }}>
              External organizations, directories, societies, and channels within the Canadian and Global collegiate debate circuit.
            </p>
          </div>

          <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>CUSID Official Site</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  The governing body for intercollegiate debate in Canada. Access tournament listings, constitution rules, general guides, and CUSID Central registries.
                </p>
              </div>
              <a href="https://cusid.ca" target="_blank" rel="noopener noreferrer" className="button" style={{ width: 'fit-content' }}>
                Visit CUSID
              </a>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>ADSA Official Site</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  The Alberta Debate and Speech Association. Explore local junior high/high school circuits for coaching opportunities and volunteer judging invitations.
                </p>
              </div>
              <a href="https://www.albertadebate.com" target="_blank" rel="noopener noreferrer" className="button" style={{ width: 'fit-content' }}>
                Visit ADSA
              </a>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Vanderbilt / World Debate Archives</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  A vast collection of recorded final rounds from the World Universities Debating Championships (WUDC) and North American championships.
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
