import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Void() {
  useEffect(() => {
    // Play easter egg audio if navigated to void
    const eeAudio = new Audio('/audio/blackhole_easteregg.mp3');
    eeAudio.volume = 0.6;
    eeAudio.loop = true;
    
    const playPromise = eeAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay prevented
      });
    }

    return () => {
      eeAudio.pause();
    };
  }, []);

  return (
    <main style={{ background: '#000000', color: '#39ff14', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: 0, padding: 0, textAlign: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10000 }}>
      <div style={{ padding: '2rem', maxWidth: '600px', animation: 'fadeIn 3s ease-in-out forwards' }}>
        <p style={{ fontSize: '1.25rem', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>&gt; you have collapsed the boundaries.</p>
        <p style={{ fontSize: '1.25rem', letterSpacing: '0.1em', marginBottom: '3rem' }}>&gt; there is nothing here but silence.</p>
        <p style={{ color: '#888888', fontSize: '0.9rem', marginBottom: '2rem' }}>[This section of the site is under construction :P]</p>
        <Link to="/" style={{ color: '#39ff14', border: '1px solid #39ff14', textDecoration: 'none', padding: '8px 16px', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.15em', transition: 'all 0.2s ease', boxShadow: '0 0 10px rgba(57, 255, 20, 0.3)' }}>
          Exit Void
        </Link>
      </div>
    </main>
  );
}
