import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ThreeJSRendererProps {
  threejsCode: string;
  width?: number;
  height?: number;
}

export default function ThreeJSRenderer({ threejsCode, width = 800, height = 600 }: ThreeJSRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threejsCode || !containerRef.current) return;
    containerRef.current.innerHTML = '';

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambientLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 2, 0);
      controls.update();

      // Safely execute Gemini code using Function constructor
      const generateModel = new Function('THREE', `${threejsCode}\nreturn model;`);
      const model = generateModel(THREE);

      if (model) {
        model.traverse?.((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);
      }

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        containerRef.current?.removeChild(renderer.domElement);
      };
    } catch (err) {
      console.error('Error rendering Three.js model:', err);
    }
  }, [threejsCode, width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
}