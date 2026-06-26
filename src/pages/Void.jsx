import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Void() {
  const navigate = useNavigate();
  const [expandedDiscord, setExpandedDiscord] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);

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

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <main style={{ background: '#000000', color: '#39ff14', fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace', minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: 0, padding: '4rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Terminal Window */}
        <div style={{
          background: '#0a0a0a',
          border: '2px solid #39ff14',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(57, 255, 20, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Terminal Window Header */}
          <div style={{
            background: '#1a1a1a',
            borderBottom: '1px solid rgba(57, 255, 20, 0.3)',
            padding: '0.6rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Window controls */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', display: 'inline-block' }}></span>
            </div>
            {/* Title */}
            <span style={{ color: '#888888', fontSize: '0.85rem' }}>void_shell - ucds_void@shell:~/portal</span>
            {/* Space for balance */}
            <div style={{ width: '48px' }}></div>
          </div>

          {/* Terminal Window Body */}
          <div style={{
            padding: '2rem',
            textAlign: 'left',
            color: '#ffffff',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div>
              <p style={{ color: '#888888', margin: '0 0 0.5rem' }}>Last login: {new Date().toLocaleDateString()} on ttys001</p>
              <p style={{ color: '#39ff14', margin: 0 }}>&gt; ucds_portal --initialize --verbose</p>
              <p style={{ color: '#888888', margin: 0 }}>Initializing boundary collapse... SUCCESS.</p>
              <p style={{ color: '#888888', margin: 0 }}>Loading directory tree structure...</p>
            </div>

            {/* Directory Tree */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px dashed rgba(57, 255, 20, 0.3)',
              borderRadius: '6px',
              padding: '1.5rem',
              fontFamily: 'inherit'
            }}>
              {/* Root folder */}
              <div style={{ color: '#39ff14', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                📂 void_root/
              </div>

              {/* Discord folder */}
              <div style={{ paddingLeft: '1.5rem' }}>
                <div 
                  onClick={() => setExpandedDiscord(!expandedDiscord)}
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#39ff14', fontWeight: 'bold', userSelect: 'none', marginBottom: '0.25rem' }}
                  onMouseEnter={() => setHoveredItem('discord_dir')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span>{expandedDiscord ? '📂' : '📁'}</span>
                  <span style={{ textDecoration: hoveredItem === 'discord_dir' ? 'underline' : 'none' }}>discord/</span>
                  <span style={{ fontSize: '0.8rem', color: '#888888', fontWeight: 'normal' }}>({expandedDiscord ? 'collapse' : 'expand'})</span>
                </div>

                {/* Sub items inside discord */}
                {expandedDiscord && (
                  <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderLeft: '1px dashed rgba(57, 255, 20, 0.2)', marginLeft: '6px', marginTop: '0.25rem', marginBottom: '0.25rem' }}>
                    
                    {/* Bot Installer file */}
                    <div 
                      onClick={() => handleNavigate('/void/discord')}
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: hoveredItem === 'bot_installer' ? 'rgba(57, 255, 20, 0.15)' : 'transparent', color: hoveredItem === 'bot_installer' ? '#39ff14' : '#ffffff', transition: 'all 0.15s' }}
                      onMouseEnter={() => setHoveredItem('bot_installer')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span>📄</span>
                      <span style={{ fontWeight: hoveredItem === 'bot_installer' ? 'bold' : 'normal' }}>bot-installer.sh</span>
                      <span style={{ fontSize: '0.75rem', color: '#888888' }}>[executable]</span>
                    </div>

                    {/* Privacy and terms file */}
                    <div 
                      onClick={() => handleNavigate('/void/discord/terms-and-privacy')}
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: hoveredItem === 'terms_privacy' ? 'rgba(57, 255, 20, 0.15)' : 'transparent', color: hoveredItem === 'terms_privacy' ? '#39ff14' : '#ffffff', transition: 'all 0.15s' }}
                      onMouseEnter={() => setHoveredItem('terms_privacy')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <span>📄</span>
                      <span style={{ fontWeight: hoveredItem === 'terms_privacy' ? 'bold' : 'normal' }}>privacy-and-terms.txt</span>
                      <span style={{ fontSize: '0.75rem', color: '#888888' }}>[readable]</span>
                    </div>

                  </div>
                )}
              </div>

              {/* Exit portal file in root */}
              <div style={{ paddingLeft: '1.5rem', marginTop: '0.25rem' }}>
                <div 
                  onClick={() => handleNavigate('/')}
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: hoveredItem === 'exit_portal' ? 'rgba(255, 255, 255, 0.15)' : 'transparent', color: hoveredItem === 'exit_portal' ? '#ffffff' : '#aaaaaa', transition: 'all 0.15s' }}
                  onMouseEnter={() => setHoveredItem('exit_portal')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span>🚪</span>
                  <span style={{ fontWeight: hoveredItem === 'exit_portal' ? 'bold' : 'normal', textDecoration: hoveredItem === 'exit_portal' ? 'underline' : 'none' }}>exit-portal.bin</span>
                  <span style={{ fontSize: '0.75rem', color: '#888888' }}>[escape route]</span>
                </div>
              </div>

            </div>

            {/* Typing command prompt */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#39ff14' }}>ucds_void@shell:~$</span>
              <span style={{ color: '#ffffff' }}>
                {hoveredItem ? `cat ${hoveredItem === 'bot_installer' ? 'discord/bot-installer.sh' : hoveredItem === 'terms_privacy' ? 'discord/privacy-and-terms.txt' : hoveredItem === 'exit_portal' ? 'exit-portal.bin' : hoveredItem === 'discord_dir' ? 'discord/' : 'void_root/'}` : 'select_target --active'}
              </span>
              <span style={{
                width: '8px',
                height: '15px',
                background: '#39ff14',
                display: 'inline-block',
                animation: 'blink 1s infinite'
              }}></span>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </main>
  );
}
