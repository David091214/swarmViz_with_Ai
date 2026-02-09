import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';

function EnvironmentModel() {
  const { scene } = useGLTF('/environment.gltf');
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
}

export default function Scene() {
  return (
    <Canvas>
      <ambientLight />
      <Suspense fallback={null}>
        <EnvironmentModel />
      </Suspense>
      {/* ...your drone components here... */}
      <OrbitControls />
    </Canvas>
  );
}