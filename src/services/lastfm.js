// src/services/lastfm.js
const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';


const NEBULA_PALETTE = [
  '#ff2a70', 
  '#bd00ff', 
  '#00e5ff', 
  '#7928ca', 
  '#ff61d2', 
  '#4df0ff', 
  '#f3e8ff', 
  '#9d4edd', 
];

function getNebulaColor(name, index) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs((hash + index * 3)) % NEBULA_PALETTE.length;
  return NEBULA_PALETTE[colorIndex];
}

export async function fetchArtistNetwork(artistName) {
  if (!API_KEY) {
    throw new Error('VITE_LASTFM_API_KEY fehlt in der .env');
  }

  const simUrl = `${BASE_URL}?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json&limit=25`;
  const simRes = await fetch(simUrl);
  const simData = await simRes.json();

  if (!simData.similarartists || !simData.similarartists.artist) {
    throw new Error('Künstler nicht gefunden');
  }

  const rawSimilar = simData.similarartists.artist;

  const rootInfoUrl = `${BASE_URL}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`;
  const rootInfoRes = await fetch(rootInfoUrl);
  const rootInfoData = await rootInfoRes.json();
  const rootArtistInfo = rootInfoData.artist || {};

  const rootTags = (rootArtistInfo.tags?.tag || []).map(t => (t.name || t).toLowerCase());
  
  // Zentraler Supernova-Kern: Leuchtendes Magenta/Pink
  const rootColor = '#ff2a70';

  const rootNode = {
    id: artistName.toLowerCase(),
    name: artistName,
    match: 1.0,
    listeners: parseInt(rootArtistInfo.stats?.listeners || 1000000, 10),
    tags: rootTags.length ? rootTags : ['music'],
    color: rootColor,
    bio: rootArtistInfo.bio?.summary?.replace(/<[^>]*>?/gm, '') || 'Keine Biografie verfügbar.',
    position: [0, 0, 0]
  };

  const total = rawSimilar.length;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  const similarNodes = rawSimilar.map((item, index) => {
    const match = parseFloat(item.match) || (1 - (index / total) * 0.75);
    const tags = (item.tags?.tag || []).map(t => (t.name || t).toLowerCase());

    
    const theta = 2 * Math.PI * index / goldenRatio;
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    
    // Distanz proportional zur Ähnlichkeit
    const radius = 12 + (1 - match) * 22;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi) * 0.85;
    const z = radius * Math.sin(phi) * Math.sin(theta);

    // Abgestimmte kosmische Nuance
    const artistColor = getNebulaColor(item.name, index);

    return {
      id: item.name.toLowerCase(),
      name: item.name,
      match: match,
      listeners: parseInt(item.listeners || 500000, 10),
      tags: tags.length ? tags : rootTags,
      color: artistColor,
      bio: `${item.name} teilt musikalische Schnittmengen mit ${artistName}.`,
      position: [x, y, z]
    };
  });

  return [rootNode, ...similarNodes];
}
