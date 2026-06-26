import { Link } from 'react-router-dom';

export default function Internal() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ marginBottom: '3rem' }}>
            <h1>Internal Resources</h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginTop: '1rem', maxWidth: '600px', marginInline: 'auto' }}>
              Official governing bylaws, policies, and internal guides for members of the University of Calgary Debate Society.
            </p>
          </div>

          <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '2rem' }}>
            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>UCDS Constitution</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Read the official guidelines, organizational policies, and structures governing the University of Calgary Debate Society.
                </p>
              </div>
              <Link to="/resources/internal/constitution" className="button" style={{ width: 'fit-content' }}>
                View Constitution
              </Link>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Executive Roster & Portfolios</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  A detailed directory of active Executive Officers, Junior Executives, and advisors, outlining specific roles, contact sheets, and project portfolios.
                </p>
              </div>
              <button disabled className="button button-secondary" style={{ width: 'fit-content', opacity: 0.7, cursor: 'not-allowed' }}>
                Coming Soon
              </button>
            </div>

            <div className="card" style={{ background: '#112854', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '1rem', padding: '2rem' }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>General Meeting Archives</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Access minutes, proposed constitutional amendments, resolutions, and budget approvals from the Annual General Meetings (AGM) and special sessions.
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
