import { useEffect, useState, useRef } from 'react';

export default function Mascot() {
  const [isActive, setIsActive] = useState(false);
  const [speech, setSpeech] = useState("Hear, Hear!");
  const headRef = useRef(null);
  const jawRef = useRef(null);
  const armRef = useRef(null);

  // Click mascot triggers funny speech bubble modifications
  const handleMascotClick = () => {
    const bubbles = [
      "Hear, Hear!",
      "POI!",
      "Resolved!",
      "Order!",
      "Motion carried!",
      "Point of Order!",
      "I speak for the mountains!",
      "UCDS is best!",
      "Let's debate!"
    ];
    const randomIndex = Math.floor(Math.random() * bubbles.length);
    setSpeech(bubbles[randomIndex]);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const totalScrollable = docHeight - winHeight;
      const remainingScroll = totalScrollable - scrollY;

      if (remainingScroll < 200 && totalScrollable > 50) {
        setIsActive(true);
        const tick = scrollY * 0.05;
        const jawAngle = Math.max(0, Math.sin(tick) * 12);
        const headAngle = -2 + Math.sin(tick * 0.5) * 5;
        const armAngle = Math.sin(tick * 2.5) * 15;

        if (jawRef.current) jawRef.current.style.transform = `rotate(${jawAngle}deg)`;
        if (headRef.current) headRef.current.style.transform = `rotate(${headAngle}deg)`;
        if (armRef.current) armRef.current.style.transform = `rotate(${armAngle}deg)`;
      } else {
        setIsActive(false);
        if (jawRef.current) jawRef.current.style.transform = '';
        if (headRef.current) headRef.current.style.transform = '';
        if (armRef.current) armRef.current.style.transform = '';
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div 
      id="rexMascotContainer" 
      className={`rex-footer-container ${isActive ? 'active' : ''}`}
      aria-hidden="true"
      onClick={handleMascotClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="rex-speech-bubble">{speech}</div>
      <svg viewBox="0 0 250 250" width="100%" height="100%" className="goofy-rex-svg">
        <ellipse cx="130" cy="235" rx="70" ry="12" fill="rgba(4, 10, 24, 0.45)" />
        <path d="M 118,125 C 115,105 120,75 125,75 L 148,75 C 152,90 152,120 152,125 Z" fill="#ff3c00" />
        <g className="rex-body-group">
          <path d="M 140,175 C 185,170 215,150 225,140 C 220,165 190,185 140,195 Z" fill="#ff3c00" />
          <path d="M 140,185 C 155,190 160,205 155,230 L 140,230 C 142,215 140,200 135,185 Z" fill="#d83200" />
          <circle cx="143" cy="230" r="3" fill="#ffffff" />
          <circle cx="149" cy="230" r="3" fill="#ffffff" />
          <path d="M 115,125 C 105,145 105,175 115,195 C 125,205 150,205 160,195 C 168,175 168,145 155,125 Z" fill="#ff3c00" />
          <path d="M 115,127 C 108,145 108,175 117,193 C 125,193 130,175 125,145 C 122,135 120,127 115,127 Z" fill="#fbbf24" />
          <path d="M 120,190 C 135,195 140,210 135,235 L 118,235 C 120,220 118,205 110,190 Z" fill="#ff3c00" />
          <circle cx="121" cy="235" r="3" fill="#ffffff" />
          <circle cx="127" cy="235" r="3" fill="#ffffff" />
          <circle cx="133" cy="235" r="3" fill="#ffffff" />
          <g ref={armRef} className="rex-silly-arm" style={{ transformOrigin: '122px 145px', willChange: 'transform' }}>
            <path d="M 122,142 C 108,142 100,150 103,155 C 106,157 112,150 120,148 Z" fill="#ff3c00" />
            <circle cx="101" cy="154" r="2.5" fill="#ffffff" />
            <circle cx="105" cy="156" r="2.5" fill="#ffffff" />
          </g>
        </g>
        <g ref={headRef} className="rex-goofy-head" style={{ transformOrigin: '135px 95px', willChange: 'transform', transition: 'transform 0.1s ease-out' }}>
          <path d="M 148,95 C 158,95 158,70 145,65 C 130,60 115,55 90,55 C 70,55 65,75 68,85 C 70,90 85,95 110,95 L 148,95 Z" fill="#ff3c00" />
          <path d="M 93,75 Q 105,66 117,75 Q 105,84 93,75 Z" fill="#ffffff" stroke="#b91c1c" strokeWidth="1.5" />
          <rect x="98" y="73.5" width="14" height="3" rx="1.5" fill="#000000" />
          <polygon points="75,95 78,103 81,95" fill="#ffffff" />
          <polygon points="81,95 84,103 87,95" fill="#ffffff" />
          <polygon points="87,95 90,103 93,95" fill="#ffffff" />
          <polygon points="93,95 96,103 99,95" fill="#ffffff" />
          <polygon points="99,95 102,103 105,95" fill="#ffffff" />
          <polygon points="105,95 108,103 111,95" fill="#ffffff" />
          <polygon points="111,95 114,103 117,95" fill="#ffffff" />
          <polygon points="117,95 120,103 123,95" fill="#ffffff" />
          <polygon points="123,95 126,103 129,95" fill="#ffffff" />
          <g ref={jawRef} className="rex-lower-jaw" style={{ transformOrigin: '135px 95px', willChange: 'transform', transition: 'transform 0.1s ease-out' }}>
            <path d="M 85,102 Q 110,95 128,96 L 128,104 Z" fill="#880000" />
            <path d="M 135,95 C 135,95 142,108 135,115 C 120,120 100,120 85,112 C 78,108 78,102 85,102 L 135,96 Z" fill="#ff3c00" />
            <polygon points="87,102 89,96 92,102" fill="#ffffff" />
            <polygon points="93,102 95,96 98,102" fill="#ffffff" />
            <polygon points="99,102 101,96 104,102" fill="#ffffff" />
            <polygon points="105,102 107,96 110,102" fill="#ffffff" />
            <polygon points="111,102 113,96 116,102" fill="#ffffff" />
            <polygon points="117,102 119,96 122,102" fill="#ffffff" />
          </g>
        </g>
      </svg>
    </div>
  );
}
