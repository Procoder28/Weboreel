import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import { useRef, Suspense } from "react";
import type { Mesh } from "three";

function FloatingShape({
  position,
  color,
  geometry,
  speed = 1,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  geometry: "sphere" | "torus" | "box" | "octa";
  speed?: number;
  scale?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
  });

  return (
    <Float speed={1.5 * speed} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} position={position} scale={scale}>
        {geometry === "sphere" && <sphereGeometry args={[1, 48, 48]} />}
        {geometry === "torus" && <torusGeometry args={[1, 0.35, 24, 64]} />}
        {geometry === "box" && <boxGeometry args={[1.4, 1.4, 1.4]} />}
        {geometry === "octa" && <octahedronGeometry args={[1.2, 0]} />}
        <MeshDistortMaterial
          color={color}
          roughness={0.15}
          metalness={0.7}
          distort={0.35}
          speed={1.5}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    </Float>
  );
}

export function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#a78bfa" />
        <pointLight position={[-10, -10, -5]} intensity={0.6} color="#60a5fa" />

        <FloatingShape position={[-3.5, 1.5, -1]} color="#8b5cf6" geometry="sphere" scale={0.9} />
        <FloatingShape position={[3.2, -1.2, -2]} color="#3b82f6" geometry="torus" scale={0.8} speed={0.8} />
        <FloatingShape position={[-2.5, -2, 1]} color="#ec4899" geometry="octa" scale={0.7} speed={1.3} />
        <FloatingShape position={[2.8, 2.2, 0]} color="#a855f7" geometry="box" scale={0.55} speed={1.1} />
        <FloatingShape position={[0, 0, -4]} color="#6366f1" geometry="sphere" scale={1.6} speed={0.5} />

        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}
