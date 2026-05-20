"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Point, Points } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { PostureTelemetry, Vector3 } from "../../../src/types";

export default function SkeletonView({ data }: { data: PostureTelemetry | null }) {
  const points = useMemo(() => {
    if (!data || !data.pose) return null;
    return Object.entries(data.pose).map(([name, pos]) => ({
      name,
      position: new THREE.Vector3(pos.x, -pos.y, pos.z), // Flip Y for typical 3D space
    }));
  }, [data]);

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative border border-zinc-800">
      {data?.analysis.neck_angle !== undefined && (
        <div className="absolute top-3 right-3 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-zinc-800/80 z-10 flex flex-col items-end">
          <span className="text-zinc-500 text-[9px] uppercase tracking-widest font-semibold">Neck Angle</span>
          <span className={`text-lg font-bold font-mono ${data.analysis.neck_angle > 20 ? 'text-orange-400 animate-pulse' : 'text-emerald-400'}`}>
            {data.analysis.neck_angle}°
          </span>
        </div>
      )}
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs italic z-10">
          Waiting for skeleton telemetry...
        </div>
      )}
      <Canvas camera={{ position: [0, 0, 3] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        {points && (
          <group scale={1.5} position={[0, 0.5, 0]}>
            {points.map((pt, i) => (
              <mesh key={i} position={pt.position}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshStandardMaterial color={data?.analysis.score && data.analysis.score > 80 ? "#4ade80" : "#fb923c"} />
              </mesh>
            ))}
            {/* Simple connections (Shoulders to elbows to hips) */}
            {data?.pose.left_shoulder && data?.pose.right_shoulder && (
                 <Line start={data.pose.left_shoulder} end={data.pose.right_shoulder} color="#333" />
            )}
          </group>
        )}

        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}

function Line({ start, end, color }: { start: Vector3, end: Vector3, color: string }) {
    const points = useMemo(() => [
        new THREE.Vector3(start.x, -start.y, start.z),
        new THREE.Vector3(end.x, -end.y, end.z)
    ], [start, end]);

    return (
        <line>
            <bufferGeometry attach="geometry">
                <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
                />
            </bufferGeometry>
            <lineBasicMaterial attach="material" color={color} linewidth={2} />
        </line>
    );
}
