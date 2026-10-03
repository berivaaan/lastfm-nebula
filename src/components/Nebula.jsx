// src/components/Nebula.jsx
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, CameraControls } from '@react-three/drei';
import { getAudioFrequencies } from '../services/audioAnalyser';

export function Nebula({ artists, selectedArtist, onSelectArtist, isPlaying, activeTag }) {
  const groupRef = useRef();
  const controlsRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  useEffect(() => {
    if (selectedArtist && controlsRef.current) {
      const [x, y, z] = selectedArtist.position;
      controlsRef.current.setLookAt(
        x + 8, y + 6, z + 12,
        x, y, z,
        true
      );
    }
  }, [selectedArtist]);

  const rootArtist = artists[0];

  return (
    <>
      <CameraControls ref={controlsRef} smoothTime={0.8} />

      <group ref={groupRef}>
        {rootArtist &&
          artists.slice(1).map((artist) => {
            const isMatch = !activeTag || (artist.tags.includes(activeTag) && rootArtist.tags.includes(activeTag));
            const opacity = isMatch ? Math.max(0.15, artist.match * 0.5) : 0.03;

            return (
              <Line
                key={`line-${artist.id}`}
                points={[rootArtist.position, artist.position]}
                color={artist.color}
                transparent
                opacity={opacity}
                lineWidth={isMatch ? 1.5 : 0.5}
              />
            );
          })}

        {artists.map((artist) => {
          const isSelected = selectedArtist?.id === artist.id;
          const matchesTag = !activeTag || artist.tags.includes(activeTag);
          const baseSize = Math.max(0.45, Math.log10(artist.listeners || 1000) * 0.16);

          return (
            <ArtistNode
              key={artist.id}
              artist={artist}
              isSelected={isSelected}
              matchesTag={matchesTag}
              isPlaying={isPlaying && isSelected}
              baseSize={baseSize}
              onSelect={() => onSelectArtist(artist)}
            />
          );
        })}
      </group>
    </>
  );
}

function ArtistNode({ artist, isSelected, matchesTag, isPlaying, baseSize, onSelect }) {
  const meshRef = useRef();
  const materialRef = useRef();

  useFrame(() => {
    if (meshRef.current && materialRef.current) {
      if (isPlaying) {
        const { bass, midHigh } = getAudioFrequencies();

        const targetScale = 1 + bass * 0.65;
        meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale }, 0.2);

        materialRef.current.emissiveIntensity = 2.2 + midHigh * 3.5;
      } else {
        meshRef.current.scale.set(1, 1, 1);
        if (materialRef.current) {
          materialRef.current.emissiveIntensity = !matchesTag
            ? 0.1
            : isSelected
            ? 2.5
            : 1.2;
        }
      }
    }
  });

  const size = isSelected ? baseSize * 1.5 : baseSize;

  return (
    <mesh
      ref={meshRef}
      position={artist.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        ref={materialRef}
        color={isSelected ? '#ffffff' : artist.color}
        emissive={artist.color}
        emissiveIntensity={!matchesTag ? 0.1 : isSelected ? 2.5 : 1.2}
        transparent
        opacity={matchesTag ? 1.0 : 0.2}
        roughness={0.15}
        toneMapped={false}
      />
    </mesh>
  );
}