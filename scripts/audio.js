document.addEventListener("DOMContentLoaded", () => {
  // Join page background audio setup
  const backgroundAudio = document.getElementById('background-audio');
  const layerAudio = document.getElementById('layer-audio');
  const layerAudio3 = document.getElementById('layer-audio-3');
  const easterEggAudio = document.getElementById('easter-egg-audio');
  if (backgroundAudio) {
    backgroundAudio.volume = 0.05; // Very quiet and ambient
    if (layerAudio) layerAudio.volume = 0; // Start layered audio completely silent
    if (layerAudio3) layerAudio3.volume = 0; // Start third layer completely silent
    if (easterEggAudio) easterEggAudio.volume = 0;

    const playAudio = () => {
      backgroundAudio.play().catch(error => {
        console.log("Background audio playback was prevented by the browser.");
      });
      if (layerAudio) layerAudio.play().catch(e => {});
      if (layerAudio3) layerAudio3.play().catch(e => {});
      if (easterEggAudio) easterEggAudio.play().catch(e => {});
    };

    playAudio();
    ['click', 'mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
      document.addEventListener(evt, playAudio, { once: true });
    });
  }
});