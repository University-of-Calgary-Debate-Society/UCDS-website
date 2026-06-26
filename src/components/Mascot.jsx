import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function Mascot() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [isActive, setIsActive] = useState(false);
  const [speech, setSpeech] = useState("Hear, Hear!");
  const [isAngerey, setIsAngerey] = useState(false);
  
  const headRef = useRef(null);

  // Click mascot triggers angry image state for a split second (500ms) and random speech bubbles
  const handleMascotClick = () => {
    if (isAngerey) return;
    setIsAngerey(true);

    const bubbles = [
      "Hey!",
      "Point of Order!",
      "Rawr!",
      "Hear, Hear!",
      "POI!",
      "Resolved!",
      "Order!",
      "Motion carried!",
      "Let's debate!"
    ];
    const randomIndex = Math.floor(Math.random() * bubbles.length);
    setSpeech(bubbles[randomIndex]);

    setTimeout(() => {
      setIsAngerey(false);
    }, 500);
  };

  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const totalScrollable = docHeight - winHeight;
      const remainingScroll = totalScrollable - scrollY;

      // Mascot appears when user scrolls near the bottom of the page
      if (remainingScroll < 200 && totalScrollable > 50) {
        setIsActive(true);
        const tick = scrollY * 0.05;
        const headAngle = -2 + Math.sin(tick * 0.5) * 5;

        if (headRef.current) headRef.current.style.transform = `rotate(${headAngle}deg)`;
      } else {
        setIsActive(false);
        if (headRef.current) headRef.current.style.transform = '';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage]);

  if (!isHomePage) return null;

  return (
    <div 
      id="rexMascotContainer" 
      className={`rex-footer-container ${isActive ? 'active' : ''}`}
      aria-hidden="true"
      onClick={handleMascotClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="rex-speech-bubble">{speech}</div>
      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img 
          ref={headRef}
          src={isAngerey ? "/photos/rex_angerey.png" : "/photos/rex.png"} 
          alt="Rex Mascot" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            transformOrigin: 'bottom center',
            transition: 'transform 0.1s ease-out',
            willChange: 'transform'
          }} 
        />
      </div>
    </div>
  );
}
