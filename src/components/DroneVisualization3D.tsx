import React, { useRef, useMemo } from 'react';
import { Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Box, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader, RepeatWrapping } from 'three';

import { DroneData, SwarmID } from '@/types/drone';
import { swarmColors, taskColors, defaultSwarmColor, defaultTaskColor } from '@/lib/colorMaps';


const VELOCITY_LENGTH_SCALE = 300;
const VELOCITY_MAX_LENGTH = 2400;
const VELOCITY_MIN_SPEED = 1e-6;
const VECTOR_INTERSECTION_THRESHOLD = 25;
function useSwarmTexture(swarmId: SwarmID) {
  const texture = useLoader(TextureLoader, `/drones/${swarmId}.png`);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4; 
  return texture;
}

interface DroneVisualization3DProps {
  drones: DroneData[];
  showTrajectories?: boolean;
  showDetectionRanges?: boolean;
  showVelocityVectors?: boolean;
  showSignalIntensity?: boolean;
  showVideoFeedback?: boolean;
  className?: string;
  timePointColors?: Record<number, string>;
  activeTimePoint?: number;
  trajectories?: { droneId: string; swarmId: SwarmID; points: [number, number, number][] }[];
}

interface VelocityVectorAttributes {
  color: string;
  direction: THREE.Vector3;
  length: number;
  speed: number;
}

interface VelocityVectorInfo {
  id: string;
  color: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
}

interface VelocityIntersection {
  id: string;
  position: [number, number, number];
  color: string;
}

function computeVelocityAttributes(drone: DroneData): VelocityVectorAttributes | null {
  const velocity = new THREE.Vector3(drone.velocity.x, drone.velocity.y, drone.velocity.z);
  const speed = velocity.length();

  if (speed < VELOCITY_MIN_SPEED) {
    return null;
  }

  const direction = velocity.clone().normalize();
  const length = Math.min(speed * VELOCITY_LENGTH_SCALE, VELOCITY_MAX_LENGTH);
  const color = speed > 10 ? '#ef4444' : speed > 5 ? '#f59e0b' : '#22c55e';

  return {
    color,
    direction,
    length,
    speed,
  };
}

function closestPointsBetweenSegments(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  q1: THREE.Vector3,
  q2: THREE.Vector3,
) {
  const EPS = 1e-6;
  const u = p2.clone().sub(p1);
  const v = q2.clone().sub(q1);
  const w = p1.clone().sub(q1);

  const a = u.dot(u);
  const b = u.dot(v);
  const c = v.dot(v);
  const d = u.dot(w);
  const e = v.dot(w);

  let sN: number;
  let sD = a;
  let tN: number;
  let tD = c;

  if (a <= EPS && c <= EPS) {
    const pointA = p1.clone();
    const pointB = q1.clone();
    return { pointA, pointB, distance: pointA.distanceTo(pointB) };
  }

  if (a <= EPS) {
    sN = 0;
    sD = 1;
    tN = e;
    tD = c;
  } else if (c <= EPS) {
    tN = 0;
    tD = 1;
    sN = -d;
    sD = a;
  } else {
    sN = b * e - c * d;
    tN = a * e - b * d;

    if (sN < 0) {
      sN = 0;
      tN = e;
      tD = c;
    } else if (sN > sD) {
      sN = sD;
      tN = e + b;
      tD = c;
    }
  }

  if (tN < 0) {
    tN = 0;

    if (-d < 0) {
      sN = 0;
    } else if (-d > a) {
      sN = sD;
    } else {
      sN = -d;
      sD = a;
    }
  } else if (tN > tD) {
    tN = tD;

    if (-d + b < 0) {
      sN = 0;
    } else if (-d + b > a) {
      sN = sD;
    } else {
      sN = -d + b;
      sD = a;
    }
  }

  const sc = Math.abs(sN) < EPS ? 0 : sN / sD;
  const tc = Math.abs(tN) < EPS ? 0 : tN / tD;

  const pointA = p1.clone().addScaledVector(u, sc);
  const pointB = q1.clone().addScaledVector(v, tc);
  const distance = pointA.distanceTo(pointB);

  return { pointA, pointB, distance };
}

function EnvironmentModel() {
  const { scene } = useGLTF('/environment.glb');
  return <primitive object={scene} scale={[10, 0.5, 10]} position={[0, -5, 0]} />;
}

function DetectionRangeOverlay({ radius, color }: { radius: number; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const fillMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const rippleMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const pulse = (elapsed * 0.5) % 1; // Slow looping pulse 0..1
    const baseOscillation = 0.12 * Math.sin(elapsed * 2.5);

    if (ringRef.current) {
      const scale = 1 + baseOscillation * 0.2;
      ringRef.current.scale.setScalar(1 + scale * 0.1);
    }

    if (fillMaterialRef.current) {
      fillMaterialRef.current.opacity = 0.06 + Math.max(0, baseOscillation) * 0.06;
    }

    if (rippleRef.current) {
      const rippleScale = 1 + pulse * 0.45;
      rippleRef.current.scale.setScalar(rippleScale);
    }

    if (rippleMaterialRef.current) {
      rippleMaterialRef.current.opacity = 0.25 * (1 - pulse);
    }
  });

  const innerRadius = Math.max(radius * 0.82, 0);

  return (
    <group position={[0, -0.35, 0]}>
      {/* Soft holographic fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}> 
        <circleGeometry args={[radius, 64]} />
        <meshBasicMaterial
          ref={fillMaterialRef}
          color={color}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Static perimeter */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}> 
        <ringGeometry args={[innerRadius, radius, 96]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Expanding ripple */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]}> 
        <ringGeometry args={[innerRadius, radius, 96]} />
        <meshBasicMaterial
          ref={rippleMaterialRef}
          color={color}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function SignalIntensityPulse({ intensity }: { intensity: number }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const normalized = THREE.MathUtils.clamp(intensity / 100, 0, 1);
  const baseInner = 0.45 + normalized * 0.25;
  const baseOuter = baseInner + 0.2 + normalized * 0.25;
  const color = new THREE.Color().setHSL(0.08 + 0.34 * normalized, 0.85, 0.55).getStyle();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 1.2;
    const pulse = (Math.sin(t) + 1) / 2; // 0..1
    if (pulseRef.current) {
      const scale = 1 + pulse * 0.12 * (0.2 + normalized);
      pulseRef.current.scale.setScalar(scale);
    }
    if (materialRef.current) {
      materialRef.current.opacity = 0.25 + normalized * 0.35 + pulse * 0.1;
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
      <mesh ref={pulseRef}>
        <ringGeometry args={[baseInner, baseOuter, 64]} />
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function VideoStatusBillboard({ active }: { active: boolean }) {
  const label = active ? 'REC' : 'OFF';
  const color = active ? '#22c55e' : '#ef4444';
  const background = active ? 'rgba(34, 197, 94, 0.22)' : 'rgba(239, 68, 68, 0.22)';

  return (
    <group position={[0, 1.5, 0]}>
      <mesh>
        <planeGeometry args={[1.2, 0.45]} />
        <meshBasicMaterial
          color={background}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.24}
        color={color}
        anchorX="center"
        anchorY="middle"
        toneMapped={false}
      >
        {label}
      </Text>
      <mesh position={[-0.4, 0, 0.05]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Individual drone component
function DroneModel({
  drone,
  showDetectionRange,
  showVelocityVector,
  showSignalIntensity = true,
  showVideoFeedback = true,
}: {
  drone: DroneData;
  showDetectionRange?: boolean;
  showVelocityVector?: boolean;
  showSignalIntensity?: boolean;
  showVideoFeedback?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const swarmColor = swarmColors[drone.swarmId] ?? defaultSwarmColor;
  const taskColor = taskColors[drone.taskId] ?? defaultTaskColor;

  const velocityAttributes = useMemo(
    () => computeVelocityAttributes(drone),
    [drone],
  );

  // Animate drone rotation based on orientation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.degToRad(drone.orientation.pitch);
      meshRef.current.rotation.y = THREE.MathUtils.degToRad(drone.orientation.yaw);
      meshRef.current.rotation.z = THREE.MathUtils.degToRad(drone.orientation.roll);
    }
  });

  // Battery-based opacity
  const opacity = Math.max(0.3, drone.batteryPercentage / 100);

  // --- Velocity visuals (Line + Cone with correct orientation) ---
  const {
    showVector,
    velocityColor,
    linePoints,
    conePosition,
    coneQuat,
    coneRadius,
    coneHeight,
    arrowGlyphs,
  } = useMemo(() => {
    if (!showVelocityVector || !velocityAttributes) {
      return {
        showVector: false,
        velocityColor: '#ffffff',
        linePoints: [[0, 0, 0], [0, 0, 0]] as [number, number, number][],
        conePosition: new THREE.Vector3(),
        coneQuat: new THREE.Quaternion(),
        coneRadius: 0.0,
        coneHeight: 0.0,
        arrowGlyphs: [] as { position: [number, number, number]; quaternion: THREE.Quaternion }[],
      };
    }

    const { color, direction, length } = velocityAttributes;

    const coneRadius = 0.32;
    const coneHeight = 1.0;
    const tip = direction.clone().multiplyScalar(length);
    const lineEnd = direction.clone().multiplyScalar(Math.max(0, length - coneHeight * 0.6));
    const up = new THREE.Vector3(0, 1, 0);
    const coneQuat = new THREE.Quaternion().setFromUnitVectors(up, direction);

    const arrowGlyphs: { position: [number, number, number]; quaternion: THREE.Quaternion }[] = [];
    const arrowCount = 5;
    if (length > 1 && arrowCount > 0) {
      const spacing = length / (arrowCount + 1);
      const glyphBaseQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(1, 0, 0),
        direction,
      );
      for (let i = 1; i <= arrowCount; i += 1) {
        const distance = spacing * i;
        const point = direction.clone().multiplyScalar(distance);
        arrowGlyphs.push({
          position: [point.x, point.y, point.z],
          quaternion: glyphBaseQuat.clone(),
        });
      }
    }

    return {
      showVector: true,
      velocityColor: color,
      linePoints: [
        [0, 0, 0],
        [lineEnd.x, lineEnd.y, lineEnd.z],
      ] as [number, number, number][],
      conePosition: tip,
      coneQuat,
      coneRadius,
      coneHeight,
      arrowGlyphs,
    };
  }, [showVelocityVector, velocityAttributes]);

  return (
    <group position={[drone.position.x, drone.position.y, drone.position.z]}>
      {/* Main drone body */}
      <Box ref={meshRef} args={[1, 0.3, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={swarmColor}
          transparent
          opacity={opacity}
          emissive={swarmColor}
          emissiveIntensity={0.2}
        />
      </Box>

      {/* Task indicator (small sphere above drone) */}
      <Sphere args={[0.2]} position={[0, 0.8, 0]}>
        <meshStandardMaterial
          color={taskColor}
          transparent
          opacity={0.8}
          emissive={taskColor}
          emissiveIntensity={0.5}
        />
      </Sphere>

      {/* Battery level indicator */}
      <Box args={[0.2, 0.1, 1.2]} position={[0.7, 0, 0]}>
        <meshStandardMaterial
          color={
            drone.batteryPercentage > 50
              ? '#22c55e'
              : drone.batteryPercentage > 25
              ? '#f59e0b'
              : '#ef4444'
          }
          transparent
          opacity={0.7}
        />
      </Box>

      {/* Detection range visualization */}
      {showDetectionRange && drone.detectionRange > 0 && (
        <DetectionRangeOverlay radius={drone.detectionRange} color={swarmColor} />
      )}

      {/* Signal intensity pulse */}
      {showSignalIntensity && <SignalIntensityPulse intensity={drone.signalIntensity} />}

      {/* Video feedback badge */}
      {showVideoFeedback && <VideoStatusBillboard active={drone.videoFeedbackOn} />}

      {/* Velocity vector (line + cone arrowhead) */}
      {showVector && (
        <group>
          <Line
            points={linePoints}
            color={velocityColor}
            lineWidth={6}
            transparent
            opacity={0.25}
            toneMapped={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
          <Line
            points={linePoints}
            color={velocityColor}
            transparent
            opacity={0.9}
            lineWidth={2}
          />
          <mesh position={conePosition} quaternion={coneQuat}>
            <coneGeometry args={[coneRadius, coneHeight, 12]} />
            <meshStandardMaterial
              color={velocityColor}
              emissive={velocityColor}
              emissiveIntensity={0.6}
            />
          </mesh>
          {arrowGlyphs.map((glyph, index) => (
            <Text
              key={`vector-arrow-${drone.droneId}-${index}`}
              position={glyph.position}
              quaternion={glyph.quaternion}
              fontSize={0.6}
              color={velocityColor}
              anchorX="center"
              anchorY="middle"
              depthWrite={false} //this makes the text render on top of other objects and arrows are always visible
              toneMapped={false}
              billboard={false}
            >
              {'>'}
            </Text>
          ))}
        </group>
      )}

      {/* Drone ID label */}
      <Text
        position={[0, -1, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {drone.droneId}
      </Text>
    </group>
  );
}

function VelocityEcho({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const offset = useRef(Math.random() * 10);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.8 + offset.current) % 1;
    const scale = 0.6 + t * 3.2;
    const opacity = 0.35 * (1 - t);

    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale);
    }
    if (materialRef.current) {
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.35, 0.65, 48]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

// Grid floor component
function GridFloor() {
  const gridSize = 200;
  const divisions = 20;

  return (
    <group position={[0, -5, 0]}>
      <gridHelper args={[gridSize, divisions, '#1e293b', '#0f172a']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[gridSize, gridSize]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// Coordinate axes
function CoordinateAxes() {
  return (
    <group>
      {/* X Axis - Red */}
      <Line points={[[-180, 0, 0], [180, 0, 0]]} color="#ef4444" lineWidth={2} />
      <Text position={[52, 0, 0]} fontSize={1} color="#ef4444">X</Text>

      {/* Y Axis - Green */}
      <Line points={[[0, -5, 0], [0, 90, 0]]} color="#22c55e" lineWidth={2} />
      <Text position={[0, 52, 0]} fontSize={1} color="#22c55e">Y</Text>

      //{/* Z Axis - Blue */}
      <Line points={[[0, 0, -180], [0, 0, 180]]} color="#0ea5e9" lineWidth={2} />
      <Text position={[0, 0, 52]} fontSize={1} color="#0ea5e9">Z</Text>
    </group>
  );
}

export function DroneVisualization3D({
  drones,
  showTrajectories = false,
  showDetectionRanges = false,
  showVelocityVectors = false,
  showSignalIntensity = true,
  showVideoFeedback = true,
  className,
  timePointColors,
  activeTimePoint,
  trajectories = [],
}: DroneVisualization3DProps) {
  const velocityVectors = useMemo(() => {
    if (!showVelocityVectors) {
      return [] as VelocityVectorInfo[];
    }

    return drones
      .map((drone) => {
        const attributes = computeVelocityAttributes(drone);
        if (!attributes) {
          return null;
        }

        const start = new THREE.Vector3(drone.position.x, drone.position.y, drone.position.z);
        const end = start.clone().addScaledVector(attributes.direction, attributes.length);

        const timePoint = typeof activeTimePoint === 'number'
          ? activeTimePoint
          : typeof drone.timePoint === 'number'
          ? Math.floor(drone.timePoint)
          : 0;
        const vectorColor = timePointColors?.[timePoint] ?? attributes.color;

        return {
          id: drone.droneId,
          color: vectorColor,
          start,
          end,
        } as VelocityVectorInfo;
      })
      .filter((item): item is VelocityVectorInfo => item !== null);
  }, [drones, showVelocityVectors, timePointColors, activeTimePoint]);

  const vectorIntersections = useMemo(() => {
    if (!showVelocityVectors) {
      return [] as VelocityIntersection[];
    }

    const intersections: VelocityIntersection[] = [];

    for (let i = 0; i < velocityVectors.length; i += 1) {
      for (let j = i + 1; j < velocityVectors.length; j += 1) {
        const a = velocityVectors[i];
        const b = velocityVectors[j];
        const { pointA, pointB, distance } = closestPointsBetweenSegments(a.start, a.end, b.start, b.end);

        if (distance <= VECTOR_INTERSECTION_THRESHOLD) {
          const midpoint = pointA.clone().add(pointB).multiplyScalar(0.5);
          const key = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;

          intersections.push({
            id: key,
            position: [midpoint.x, midpoint.y, midpoint.z],
            color: a.color,
          });
        }
      }
    }

    return intersections;
  }, [showVelocityVectors, velocityVectors]);

  const trajectoryLines = useMemo(() => {
    if (!showTrajectories) {
      return [] as { id: string; color: string; points: [number, number, number][] }[];
    }

    return trajectories.map((path) => ({
      id: path.droneId,
      color: swarmColors[path.swarmId] ?? defaultSwarmColor,
      points: path.points,
    }));
  }, [showTrajectories, trajectories]);

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [50, 40, 50], fov: 60 }}
        style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 70%)' }}
      >
        <Suspense fallback={null}>
          <EnvironmentModel />
        </Suspense>

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 50, 0]} intensity={0.5} color="#0ea5e9" />

        {/* Controls */}
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={10}
          maxDistance={1200}
        />

        {/* Scene elements */}
        <GridFloor />
        <CoordinateAxes />

        {showVelocityVectors &&
          vectorIntersections.map((intersection) => (
            <VelocityEcho
              key={intersection.id}
              position={intersection.position}
              color={intersection.color}
            />
          ))}

        {showTrajectories &&
          trajectoryLines.map((line) => (
            <Line
              key={`trajectory-${line.id}`}
              points={line.points}
              color={line.color}
              lineWidth={2}
              transparent
              opacity={0.6}
            />
          ))}

        {/* Render all drones */}
        {drones.map((drone) => (
          <DroneModel
            key={`${drone.droneId}-${drone.timePoint}`}
            drone={drone}
            showDetectionRange={showDetectionRanges}
            showVelocityVector={showVelocityVectors}
            showSignalIntensity={showSignalIntensity}
            showVideoFeedback={showVideoFeedback}
          />
        ))}

        {/* Environment fog for depth */}
        <fog attach="fog" args={['#0f172a', 50, 300]} />
      </Canvas>
    </div>
  );
}
