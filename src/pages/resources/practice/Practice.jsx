import { Link } from 'react-router-dom';

export default function Practice() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '3rem' }}>
            <h1>Practice & Training Resources</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginTop: '1rem', maxWidth: '600px', marginInline: 'auto' }}>
              Materials, training curricula, and motion archives to prepare for weekly practices and intercollegiate tournaments.
            </p>
          </div>

          <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Motion Archives</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Browse our repository of past debate motions categorized by theme (e.g., Geopolitics, Ethics, Economics, Pop Culture) to practice case construction.
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Weekly Quicksheets</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Short, high-yield cheat sheets written by our Directors of Training covering core skills like refutation, extensions, adjudicating, and points of information.
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Adjudication Guide</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Learn how to judge debate rounds objectively, track arguments on flows, provide constructive feedback, and submit quality ballots at tournaments.
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
