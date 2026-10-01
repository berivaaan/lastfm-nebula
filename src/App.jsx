// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Search, Music, Radio, Users } from 'lucide-react';
import { fetchArtistNetwork } from "./services/lastfm";
import { Nebula } from "./components/Nebula";

export default function App() {
  const [query, setQuery] = useState('Radiohead');
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNetwork = async (artistName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArtistNetwork(artistName);
      setArtists(data);
      setSelectedArtist(data[0] || null);
    } catch (err) {
      setError(err.message || 'Konnte Daten nicht laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork('Radiohead');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) loadNetwork(query.trim());
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a12', position: 'relative', overflow: 'hidden', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* 2D UI Overlay - Header / Search */}
      <header style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: '6px 14px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Künstler eingeben..."
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: 180, fontSize: 14 }}
          />
          <button type="submit" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </button>
        </form>
        {loading && <span style={{ fontSize: 13, color: '#aaa' }}>Lade Galaxie...</span>}
        {error && <span style={{ fontSize: 13, color: '#ff6666' }}>{error}</span>}
      </header>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 10, 45], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <Nebula
          artists={artists}
          selectedArtist={selectedArtist}
          onSelectArtist={setSelectedArtist}
        />
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>

      {/* 2D Info Card Overlay rechts */}
      {selectedArtist && (
        <aside style={{ position: 'absolute', bottom: 24, right: 24, width: 320, background: 'rgba(15, 15, 25, 0.85)', backdropFilter: 'blur(12px)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Radio size={18} color={selectedArtist.color} />
            <h2 style={{ margin: 0, fontSize: 20 }}>{selectedArtist.name}</h2>
          </div>
          
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#aaa', marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {selectedArtist.listeners.toLocaleString()} Hörer</span>
            <span>Match: {Math.round(selectedArtist.match * 100)}%</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {selectedArtist.tags.slice(0, 4).map((tag) => (
              <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10, fontSize: 11, color: '#ddd' }}>
                #{tag}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.5, color: '#ccc', maxHeight: 80, overflowY: 'auto', margin: 0 }}>
            {selectedArtist.bio}
          </p>

          <button
            onClick={() => loadNetwork(selectedArtist.name)}
            style={{ marginTop: 14, width: '100%', padding: '8px 0', borderRadius: 8, border: 'none', background: selectedArtist.color, color: '#000', fontWeight: 'bold', fontSize: 12, cursor: 'pointer' }}
          >
            Von hier aus weitersuchen
          </button>
        </aside>
      )}
    </div>
  );
}