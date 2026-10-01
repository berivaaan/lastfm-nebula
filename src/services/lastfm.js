// src/services/lastfm.js
const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export async function fetchArtistNetwork(rootArtist, limit = 25) {
  try {
    // 1. Hole ähnliche Künstler zum Root-Artist
    const simRes = await fetch(
      `${BASE_URL}?method=artist.getsimilar&artist=${encodeURIComponent(rootArtist)}&api_key=${API_KEY}&format=json&limit=${limit}`
    );
    const simData = await simRes.json();
    
    if (!simData.similarartists || !simData.similarartists.artist) {
      throw new Error('Künstler nicht gefunden oder keine ähnlichen Künstler verfügbar');
    }

    const rawArtists = [
      { name: rootArtist, match: 1.0 },
      ...simData.similarartists.artist.map((a) => ({
        name: a.name,
        match: parseFloat(a.match) || 0.5,
      })),
    ];

    // 2. Metadaten (Top Tags & Listener) für jeden Künstler anreichern
    const enrichedArtists = await Promise.all(
      rawArtists.map(async (artist, index) => {
        try {
          const infoRes = await fetch(
            `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(artist.name)}&api_key=${API_KEY}&format=json`
          );
          const infoData = await infoRes.json();
          const info = infoData.artist || {};
          const tags = info.tags?.tag?.map((t) => t.name) || ['music'];
          const listeners = parseInt(info.stats?.listeners || '1000', 10);

          // Mathematisches 3D-Mapping (Radius + Cluster-Winkel basierend auf Match & Index)
          // Root Artist sitzt im Zentrum (0, 0, 0)
          let x = 0, y = 0, z = 0;
          if (index !== 0) {
            const distance = (1.05 - artist.match) * 35; // Höherer Match = näher am Zentrum
            const phi = Math.acos(-1 + (2 * index) / rawArtists.length);
            const theta = Math.sqrt(rawArtists.length * Math.PI) * phi;

            x = distance * Math.cos(theta) * Math.sin(phi);
            y = distance * Math.sin(theta) * Math.sin(phi);
            z = distance * Math.cos(phi);
          }

          // Farbcodierung nach Top-Tag
          const color = getTagColor(tags[0] || 'general');

          return {
            id: artist.name,
            name: artist.name,
            match: artist.match,
            listeners,
            tags,
            topTag: tags[0] || 'Unbekannt',
            bio: info.bio?.summary ? info.bio.summary.split('<a')[0] : 'Keine Biografie verfügbar.',
            position: [x, y, z],
            color,
          };
        } catch {
          return null;
        }
      })
    );

    return enrichedArtists.filter(Boolean);
  } catch (err) {
    console.error('Fehler beim Abrufen der Last.fm-Daten:', err);
    throw err;
  }
}

// Farbcodierung für visuelle Clusterbildung
function getTagColor(tag) {
  const t = tag.toLowerCase();
  if (t.includes('rock') || t.includes('metal')) return '#ff3366';
  if (t.includes('pop') || t.includes('indie')) return '#33ccff';
  if (t.includes('electronic') || t.includes('techno') || t.includes('dance')) return '#00ffcc';
  if (t.includes('hip hop') || t.includes('rap')) return '#ffbb00';
  if (t.includes('jazz') || t.includes('blues') || t.includes('soul')) return '#cc66ff';
  if (t.includes('ambient') || t.includes('folk')) return '#66ff66';
  return '#ffffff';
}