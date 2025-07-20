import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, Maximize, Minimize } from 'lucide-react';

interface ThreeJSRendererProps {
  threejsCode: string;
  width?: number;
  height?: number;
}

export default function ThreeJSRenderer({ threejsCode, width = 800, height = 600 }: ThreeJSRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(10);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!threejsCode || !containerRef.current) return;
    containerRef.current.innerHTML = '';

    let mixer: THREE.AnimationMixer | null = null;
    let clock = new THREE.Clock();

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.appendChild(renderer.domElement);

      // Enhanced lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.target.set(0, 2, 0);
      controls.maxDistance = 50;
      controls.minDistance = 1;
      controls.maxPolarAngle = Math.PI;
      controls.minPolarAngle = 0;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.autoRotate = false;
      controls.autoRotateSpeed = 2.0;
      controlsRef.current = controls;
      controls.update();

      // Execute Gemini-generated code
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

        // If animation data is attached to model.userData, initialize the mixer
        if (model.userData?.clips?.length) {
          mixer = new THREE.AnimationMixer(model);
          model.userData.clips.forEach((clip: THREE.AnimationClip) => {
            mixer!.clipAction(clip).play();
          });
        }
      }

      const animate = () => {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer?.update(delta);
        controls.update();
        renderer.render(scene, camera);
        
        // Update camera distance for UI
        if (cameraRef.current) {
          const distance = cameraRef.current.position.distanceTo(controls.target);
          setCameraDistance(Math.round(distance * 10) / 10);
        }
      };

      animate();

      const handleResize = () => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener('resize', handleResize);

      // Keyboard controls
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!controlsRef.current || !cameraRef.current) return;
        
        const key = event.key.toLowerCase();
        const currentDistance = cameraRef.current.position.distanceTo(controlsRef.current.target);
        
        switch (key) {
          case 'r':
          case 'r':
            // Reset camera
            cameraRef.current.position.set(10, 10, 10);
            controlsRef.current.target.set(0, 2, 0);
            controlsRef.current.update();
            break;
          case 'a':
            // Toggle auto-rotate
            const newAutoRotate = !controlsRef.current.autoRotate;
            controlsRef.current.autoRotate = newAutoRotate;
            setIsAutoRotating(newAutoRotate);
            break;
          case '=':
          case '+':
            // Zoom in
            const zoomInDistance = Math.max(currentDistance * 0.8, 1);
            cameraRef.current.position.sub(controlsRef.current.target).normalize().multiplyScalar(zoomInDistance).add(controlsRef.current.target);
            controlsRef.current.update();
            break;
          case '-':
          case '_':
            // Zoom out
            const zoomOutDistance = Math.min(currentDistance * 1.2, 50);
            cameraRef.current.position.sub(controlsRef.current.target).normalize().multiplyScalar(zoomOutDistance).add(controlsRef.current.target);
            controlsRef.current.update();
            break;
          case 'f':
            // Toggle fullscreen
            handleToggleFullscreen();
            break;
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        containerRef.current?.removeChild(renderer.domElement);
      };
    } catch (err) {
      console.error('Error rendering Three.js model:', err);
    }
  }, [threejsCode, width, height]);

  const handleZoomIn = () => {
    if (controlsRef.current && cameraRef.current) {
      const currentDistance = cameraRef.current.position.distanceTo(controlsRef.current.target);
      const newDistance = Math.max(currentDistance * 0.8, 1);
      cameraRef.current.position.sub(controlsRef.current.target).normalize().multiplyScalar(newDistance).add(controlsRef.current.target);
      controlsRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current && cameraRef.current) {
      const currentDistance = cameraRef.current.position.distanceTo(controlsRef.current.target);
      const newDistance = Math.min(currentDistance * 1.2, 50);
      cameraRef.current.position.sub(controlsRef.current.target).normalize().multiplyScalar(newDistance).add(controlsRef.current.target);
      controlsRef.current.update();
    }
  };

  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      cameraRef.current.position.set(10, 10, 10);
      controlsRef.current.target.set(0, 2, 0);
      controlsRef.current.update();
    }
  };

  const handleToggleAutoRotate = () => {
    if (controlsRef.current) {
      const newAutoRotate = !controlsRef.current.autoRotate;
      controlsRef.current.autoRotate = newAutoRotate;
      setIsAutoRotating(newAutoRotate);
    }
  };

  const handleToggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div className="relative w-full">
      {/* 3D Renderer Container */}
      <div
        ref={containerRef}
        style={{
          width,
          height,
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
      />
      
      {/* Control Panel */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {/* Zoom Controls */}
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2 flex flex-col space-y-1">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
        </div>

        {/* Camera Controls */}
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2 flex flex-col space-y-1">
          <button
            onClick={handleResetCamera}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
            title="Reset Camera"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={handleToggleAutoRotate}
            className={`p-2 rounded-md transition-colors duration-200 ${
              isAutoRotating 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={isAutoRotating ? "Stop Auto-Rotation" : "Start Auto-Rotation"}
          >
            {isAutoRotating ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        {/* Fullscreen Control */}
        <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2">
          <button
            onClick={handleToggleFullscreen}
            className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors duration-200"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-gray-300">Distance:</span>
            <span className="font-mono">{cameraDistance}m</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-300">Auto-rotate:</span>
            <span className={isAutoRotating ? 'text-green-400' : 'text-red-400'}>
              {isAutoRotating ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions Panel */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 text-white text-xs max-w-56">
        <div className="space-y-1">
          <div className="font-semibold text-purple-300 mb-2">Controls:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>🖱️ <span className="text-gray-300">Mouse:</span> Rotate</div>
            <div>🔍 <span className="text-gray-300">Scroll:</span> Zoom</div>
            <div>🖱️ <span className="text-gray-300">Right-click:</span> Pan</div>
            <div>⌨️ <span className="text-gray-300">R:</span> Reset</div>
            <div>⌨️ <span className="text-gray-300">A:</span> Auto-rotate</div>
            <div>⌨️ <span className="text-gray-300">+/-:</span> Zoom</div>
            <div>⌨️ <span className="text-gray-300">F:</span> Fullscreen</div>
          </div>
        </div>
      </div>
    </div>
  );
}
