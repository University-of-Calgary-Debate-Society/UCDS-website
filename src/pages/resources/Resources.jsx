import { Link } from 'react-router-dom';

const BookIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const YouTubeIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

const HeadphoneIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const NoteIcon = ({ size = 24, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const bgIcons = [
  // Densest around title (top center area)
  { type: 'book', size: 48, top: '40px', left: '12%', delay: '0s', duration: 'float-anim-slow' },
  { type: 'youtube', size: 36, top: '25px', left: '26%', delay: '2s', duration: 'float-anim-medium' },
  { type: 'headphone', size: 42, top: '80px', left: '38%', delay: '1s', duration: 'float-anim-fast' },
  { type: 'note', size: 32, top: '30px', left: '55%', delay: '4s', duration: 'float-anim-slow' },
  { type: 'book', size: 50, top: '75px', left: '68%', delay: '3s', duration: 'float-anim-medium' },
  { type: 'youtube', size: 44, top: '35px', left: '82%', delay: '0.5s', duration: 'float-anim-fast' },
  { type: 'note', size: 38, top: '110px', left: '90%', delay: '1.5s', duration: 'float-anim-slow' },
  { type: 'headphone', size: 36, top: '130px', left: '18%', delay: '2.5s', duration: 'float-anim-medium' },
  { type: 'book', size: 30, top: '160px', left: '48%', delay: '3.5s', duration: 'float-anim-fast' },
  { type: 'youtube', size: 34, top: '190px', left: '76%', delay: '5s', duration: 'float-anim-slow' },

  // Scattered lower down the page
  { type: 'book', size: 44, top: '420px', left: '5%', delay: '1.2s', duration: 'float-anim-medium' },
  { type: 'headphone', size: 48, top: '560px', left: '92%', delay: '0.8s', duration: 'float-anim-slow' },
  { type: 'note', size: 40, top: '820px', left: '88%', delay: '2.2s', duration: 'float-anim-fast' },
  { type: 'book', size: 36, top: '980px', left: '10%', delay: '4.1s', duration: 'float-anim-medium' },
  { type: 'youtube', size: 46, top: '1150px', left: '8%', delay: '1.7s', duration: 'float-anim-slow' },
  { type: 'note', size: 42, top: '1280px', left: '91%', delay: '3.3s', duration: 'float-anim-fast' }
];

export default function Resources() {
  const renderIcon = (type, size) => {
    switch (type) {
      case 'book': return <BookIcon size={size} />;
      case 'youtube': return <YouTubeIcon size={size} />;
      case 'headphone': return <HeadphoneIcon size={size} />;
      case 'note': return <NoteIcon size={size} />;
      default: return null;
    }
  };

  return (
    <main className="resources-page-container">
      {/* Floating decorative icons in background */}
      <div className="resources-bg-decorations">
        {bgIcons.map((icon, index) => (
          <div 
            key={index}
            className={`floating-bg-icon ${icon.duration}`}
            style={{
              top: icon.top,
              left: icon.left,
              animationDelay: icon.delay
            }}
          >
            {renderIcon(icon.type, icon.size)}
          </div>
        ))}
      </div>

      <section className="section">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-header">
            <h2>Resources</h2>
          </div>
          <p className="section-copy" style={{ marginBottom: '3rem' }}>
            Browse our libraries of bylaws, training guides, subject briefs, and external materials.
          </p>
          
          <div className="resources-card-grid">
            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Internal Resources</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Access our governing bylaws, organizational policies, constitution, general meeting minutes, and executive roles.
                </p>
              </div>
              <Link to="/resources/internal" className="button" style={{ width: 'fit-content' }}>
                Browse Internal
              </Link>
            </div>

            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Practice & Training</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Prepare for practices and tournaments with motion archives, debate training quicksheets, and adjudication guides.
                </p>
              </div>
              <Link to="/resources/practice" className="button" style={{ width: 'fit-content' }}>
                Browse Training
              </Link>
            </div>

            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>External Resources</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Explore directories, external debate platforms, governing organizations, and useful online debate tools.
                </p>
              </div>
              <Link to="/resources/external" className="button" style={{ width: 'fit-content' }}>
                Explore External
              </Link>
            </div>

            <div className="resources-card">
              <div>
                <h3 style={{ color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem' }}>Matter Files</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'left' }}>
                  Build your background knowledge with comprehensive subject briefs, case libraries, and topic quick-guides.
                </p>
              </div>
              <Link to="/resources/matter" className="button" style={{ width: 'fit-content' }}>
                View Matter Files
              </Link>
            </div>
          </div>

          {/* Recommended resources section */}
          <div className="recommended-section">
            <div className="recommended-header">
              <h3>Recommended Resources</h3>
              <p>Highly recommended external tools and platforms to help you master debating and public speaking.</p>
            </div>
            <div className="recommended-grid">
              <a href="https://www.youtube.com/@DebateLand" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <YouTubeIcon size={20} style={{ color: '#ef4444' }} />
                  Debate Land / Hello Debate
                </h4>
                <p>An amazing YouTube channel offering visual tutorials, guides, and lessons covering British Parliamentary debate theory.</p>
              </a>
              
              <a href="https://cusid.ca" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <BookIcon size={20} style={{ color: '#60a5fa' }} />
                  CUSID Website
                </h4>
                <p>The central hub for the Canadian University Society for Intercollegiate Debate. Check tournament schedules, bids, and bylaws.</p>
              </a>
              
              <a href="https://www.hellodebate.jp/motions/" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <NoteIcon size={20} style={{ color: '#34d399' }} />
                  World Motions Database
                </h4>
                <p>Browse a comprehensive, categorized collection of debate motions from major regional and international championships.</p>
              </a>
              
              <a href="https://openev.pages.dev/" target="_blank" rel="noopener noreferrer" className="recommended-item">
                <h4>
                  <HeadphoneIcon size={20} style={{ color: '#facc15' }} />
                  Open Debating Resources
                </h4>
                <p>A collection of open-source debate files, lecture notes, research briefs, and templates shared by debaters worldwide.</p>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
