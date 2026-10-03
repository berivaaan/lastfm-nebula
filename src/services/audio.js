// src/services/audio.js
export async function fetchArtistPreview(artistName) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
  
      if (data.results && data.results.length > 0) {
        const track = data.results[0];
        return {
          trackName: track.trackName,
          previewUrl: track.previewUrl,
          artwork: track.artworkUrl100,
        };
      }
      return null;
    } catch (err) {
      console.warn('Audio-Preview konnte nicht geladen werden:', err);
      return null;
    }
  }