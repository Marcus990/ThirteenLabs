import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface ThreeJSViewerProps {
  threejsCode: string;
}

const ThreeJSViewer: React.FC<ThreeJSViewerProps> = ({ threejsCode }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current || !threejsCode) return;

    // Clean up previous scene
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Mount renderer
    mountRef.current.appendChild(renderer.domElement);

    // Execute the Three.js code
    try {
      // Create a safe execution environment
      const THREE_SAFE = THREE;
      const scene_safe = scene;
      const camera_safe = camera;
      
      // Create a function from the code
      const executeCode = new Function(
        'THREE', 'scene', 'camera', 'renderer',
        `
        try {
          ${threejsCode}
          
          // If the code exports a chair object, add it to the scene
          if (typeof chair !== 'undefined') {
            scene.add(chair);
          }
        } catch (error) {
          console.error('Error executing Three.js code:', error);
          // Don't create fallback cubes - just log the error
        }
        `
      );

      executeCode(THREE_SAFE, scene_safe, camera_safe, renderer);

    } catch (error) {
      console.error('Error executing Three.js code:', error);
      // Don't create fallback cubes - just log the error
    }

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [threejsCode]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ThreeJSViewer; 