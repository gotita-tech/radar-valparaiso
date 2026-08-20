"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function GoldDust({ count = 260 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14; // x
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8; // y
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6; // z
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    // Deriva lenta y respiración sutil, como polvo de oro en el aire quieto.
    pointsRef.current.rotation.y = t * 0.015;
    pointsRef.current.position.y = Math.sin(t * 0.12) * 0.15;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#D4AF37"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Anillo delgado, casi un trazo de pincel sumi-e en 3D: gira despacio
 * detrás del titular, aportando profundidad sin competir con el texto.
 */
function DriftingRing() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = 1.1 + Math.sin(t * 0.08) * 0.08;
    ref.current.rotation.z = t * 0.03;
  });

  return (
    <mesh ref={ref} position={[0, 0, -2.5]}>
      <torusGeometry args={[2.6, 0.006, 16, 120]} />
      <meshBasicMaterial color="#C9A227" transparent opacity={0.28} />
    </mesh>
  );
}

export default function GoldParticlesScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <GoldDust />
      <DriftingRing />
    </Canvas>
  );
}
