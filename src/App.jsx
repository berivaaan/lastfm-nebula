// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Search, Radio, Users, Play, Pause, Volume2, Filter, ChevronRight, Compass, Activity } from 'lucide-react';
import { fetchArtistNetwork } from './services/lastfm';
import { fetchArtistPreview } from './services/audio';
import { setupAudioAnalyser, getAudioFrequencies } from './services/audioAnalyser';
import { Nebula } from './components/Nebula';

export default function App() {
  const [query, setQuery] = useState('Radiohead');
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [historyTrail, setHistoryTrail] = useState(['Radiohead']);
  const [previewData, setPreviewData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveDescriptors, setLiveDescriptors] = useState({ brightness: 0, energy: 0 });
  const audioRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.onended = () => {
      setIsPlaying(false);
      setLiveDescriptors({ brightness: 0, energy: 0 });
    };
    audioRef.current = audio;

    return () => {
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      if (isPlaying) {
        const { brightness, energy } = getAudioFrequencies();
        setLiveDescriptors({ brightness, energy });
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setLiveDescriptors({ brightness: 0, energy: 0 });
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const availableTags = useMemo(() => {
    const counts = {};
    artists.forEach((a) => {
      (a.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([tag]) => tag);
  }, [artists]);

  const loadNetwork = async (artistName, appendHistory = false) => {
    setLoading(true);
    setError(null);
    setActiveTag(null);
    try {
      const data = await fetchArtistNetwork(artistName);
      setArtists(data);
      setQuery(artistName);

      if (appendHistory) {
        setHistoryTrail((prev) => [...prev, artistName]);
      }

      if (data.length > 0) {
        handleSelectArtist(data[0]);
      }
    } catch (err) {
      setError(err.message || 'Konnte Daten nicht laden');
    } finally {
      setLoading(false);
    }
  };

  const jumpToHistoryIndex = (index) => {
    const targetArtist = historyTrail[index];
    setHistoryTrail((prev) => prev.slice(0, index + 1));
    loadNetwork(targetArtist, false);
  };

  const handleSelectArtist = async (artist) => {
    setSelectedArtist(artist);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const preview = await fetchArtistPreview(artist.name);
    setPreviewData(preview);

    if (preview?.previewUrl && audioRef.current) {
      audioRef.current.src = preview.previewUrl;
      setupAudioAnalyser(audioRef.current);
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) return;
    setupAudioAnalyser(audioRef.current);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(console.warn);
    }
  };

  useEffect(() => {
    loadNetwork('Radiohead', false);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setHistoryTrail([query.trim()]);
      loadNetwork(query.trim(), false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#05050b', position: 'relative', overflow: 'hidden', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* 2D UI Overlay - Header / Search, History & Tag Filter */}
      <header style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        
        {/* Suchleiste */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
        </div>

        {/* Stardust Trail / Breadcrumbs Navigation */}
        {historyTrail.length > 1 && (
          <nav aria-label="Exploration Trail" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(15,15,25,0.7)', padding: '4px 10px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', width: 'fit-content' }}>
            <Compass size={13} color="#00e5ff" style={{ marginRight: 4 }} />
            {historyTrail.map((item, idx) => {
              const isCurrent = idx === historyTrail.length - 1;
              return (
                <React.Fragment key={`${item}-${idx}`}>
                  <button
                    onClick={() => jumpToHistoryIndex(idx)}
                    disabled={isCurrent}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isCurrent ? '#00e5ff' : '#aaa',
                      fontWeight: isCurrent ? 'bold' : 'normal',
                      fontSize: 12,
                      cursor: isCurrent ? 'default' : 'pointer',
                      padding: 0,
                    }}
                  >
                    {item}
                  </button>
                  {idx < historyTrail.length - 1 && <ChevronRight size={12} color="#666" />}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Tag Filter Leiste */}
        {availableTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', maxWidth: 620 }}>
            <span style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 3, marginRight: 2 }}>
              <Filter size={11} /> Filter:
            </span>
            <button
              onClick={() => setActiveTag(null)}
              style={{
                background: activeTag === null ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Alle
            </button>
            {availableTags.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(isActive ? null : tag)}
                  style={{
                    background: isActive ? '#00e5ff' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: isActive ? '#000' : '#ccc',
                    fontWeight: isActive ? 'bold' : 'normal',
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 15, 50], fov: 60 }} gl={{ toneMappingExposure: 1.2 }}>
        <color attach="background" args={['#05050b']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[20, 20, 20]} intensity={1.5} />
        
        <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={1.2} />
        
        <Nebula
          artists={artists}
          selectedArtist={selectedArtist}
          onSelectArtist={handleSelectArtist}
          isPlaying={isPlaying}
          activeTag={activeTag}
        />

        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={0.8}
            luminanceSmoothing={0.3}
            intensity={1.4}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>

      {/* 2D Info Card Overlay rechts */}
      {selectedArtist && (
        <aside style={{ position: 'absolute', bottom: 24, right: 24, width: 330, background: 'rgba(15, 15, 25, 0.88)', backdropFilter: 'blur(12px)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={18} color={selectedArtist.color} />
              <h2 style={{ margin: 0, fontSize: 20 }}>{selectedArtist.name}</h2>
            </div>
            {previewData?.artwork && (
              <img src={previewData.artwork} alt="Artwork" style={{ width: 42, height: 42, borderRadius: 8 }} />
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#aaa', marginBottom: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {selectedArtist.listeners.toLocaleString()} Hörer</span>
            <span>Match: {Math.round(selectedArtist.match * 100)}%</span>
          </div>

          {/* Audio Player Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', padding: '8px 12px', borderRadius: 10, marginBottom: 10 }}>
            <button
              onClick={togglePlay}
              disabled={!previewData?.previewUrl}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                background: previewData?.previewUrl ? selectedArtist.color : '#444',
                color: '#000',
                cursor: previewData?.previewUrl ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {previewData?.trackName || (previewData === null ? 'Keine Vorschau verfügbar' : 'Lade Track...')}
              </div>
              <div style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Volume2 size={10} /> 30s iTunes Preview
              </div>
            </div>
          </div>

          {/* MIR Audio Features (Echtzeit-Signalverarbeitung) */}
          {isPlaying && (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={11} color="#00e5ff" /> Live MIR Signal Features
              </div>
              
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 2 }}>
                  <span>Spectral Brightness</span>
                  <span>{Math.round(liveDescriptors.brightness * 100)}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, liveDescriptors.brightness * 100)}%`, height: '100%', background: '#00e5ff', transition: 'width 0.08s ease' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 2 }}>
                  <span>Audio Energy (RMS)</span>
                  <span>{Math.round(liveDescriptors.energy * 100)}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, liveDescriptors.energy * 100)}%`, height: '100%', background: selectedArtist.color, transition: 'width 0.08s ease' }} />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {selectedArtist.tags.slice(0, 4).map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={{
                  background: activeTag === tag ? '#00e5ff' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11,
                  color: activeTag === tag ? '#000' : '#ddd',
                  cursor: 'pointer',
                }}
              >
                #{tag}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, lineHeight: 1.5, color: '#ccc', maxHeight: 60, overflowY: 'auto', margin: 0 }}>
            {selectedArtist.bio}
          </p>

          {artists.length > 0 && selectedArtist.name.toLowerCase() === artists[0].name.toLowerCase() ? (
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: '#888', fontStyle: 'italic' }}>
              Zentrum der aktuellen Galaxie
            </div>
          ) : (
            <button
              onClick={() => loadNetwork(selectedArtist.name, true)}
              style={{
                marginTop: 14,
                width: '100%',
                padding: '10px 0',
                borderRadius: 8,
                border: 'none',
                background: selectedArtist.color,
                color: '#000',
                fontWeight: 'bold',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Galaxie für {selectedArtist.name} erkunden →
            </button>
          )}
        </aside>
      )}
    </div>
  );
}