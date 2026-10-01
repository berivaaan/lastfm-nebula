// src/components/Nebula.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

export function Nebula({ artists, selectedArtist, onSelectArtist }) {
  const groupRef = useRef();

  // Sanfte Rotation der gesamten Sternenwolke
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const rootArtist = artists[0];

  return (
    <group ref={groupRef}>
      {/* Verbindungslinien vom Zentrum (Root) zu ähnlichen Künstlern */}
      {rootArtist &&
        artists.slice(1).map((artist) => (
          <Line
            key={`line-${artist.id}`}
            points={[rootArtist.position, artist.position]}
            color={artist.color}
            transparent
            opacity={Math.max(0.1, artist.match * 0.4)}
            lineWidth={1}
          />
        ))}

      {/* Partikel / Sterne für jeden Künstler */}
      {artists.map((artist) => {
        const isSelected = selectedArtist?.id === artist.id;
        const size = Math.max(0.4, Math.log10(artist.listeners || 1000) * 0.15);

        return (
          <mesh
            key={artist.id}
            position={artist.position}
            onClick={(e) => {
              e.stopPropagation();
              onSelectArtist(artist);
            }}
          >
            <sphereGeometry args={[isSelected ? size * 1.5 : size, 16, 16]} />
            <meshStandardMaterial
              color={isSelected ? '#ffffff' : artist.color}
              emissive={artist.color}
              emissiveIntensity={isSelected ? 1.5 : 0.6}
              roughness={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}