"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
uniform float uHover;
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Create a wave effect based on hover state
  float wave = sin(pos.x * 5.0 + uTime * 2.0) * 0.1 * uHover;
  pos.z += wave;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uHover;
varying vec2 vUv;

void main() {
  // Zoom slightly on hover
  vec2 uv = vUv;
  vec2 center = vec2(0.5, 0.5);
  uv = center + (uv - center) * (1.0 - uHover * 0.1);
  
  // RGB Split effect
  float offset = uHover * 0.02;
  float r = texture2D(uTexture, uv + vec2(offset, 0.0)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - vec2(offset, 0.0)).b;
  
  // Transition between greyscale and color based on hover
  vec4 tex = texture2D(uTexture, uv);
  float grey = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  vec3 greyColor = vec3(grey);
  
  // Mix original color with RGB split color + gray based on hover
  vec3 finalColor = mix(greyColor, vec3(r,g,b), uHover);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

interface ShaderPlaneProps {
  url: string;
  isHovered: boolean;
}

function ShaderPlane({ url, isHovered }: ShaderPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Load texture
  const texture = useLoader(THREE.TextureLoader, url, (loader) => {
    loader.setCrossOrigin("anonymous");
  });

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const targetHover = isHovered ? 1.0 : 0.0;
      materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uHover.value,
        targetHover,
        delta * 5.0
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTexture: { value: texture },
          uTime: { value: 0 },
          uHover: { value: 0 },
        }}
      />
    </mesh>
  );
}

interface WebGLImageProps {
  src: string;
  isHovered: boolean;
}

export default function WebGLImage({ src, isHovered }: WebGLImageProps) {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
      <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1 }}>
        <Suspense fallback={null}>
          <ShaderPlane url={src} isHovered={isHovered} />
        </Suspense>
      </Canvas>
    </div>
  );
}
