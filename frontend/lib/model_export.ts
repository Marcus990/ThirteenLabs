import * as THREE from 'three';

// NOTE: Import GLTFExporter dynamically to avoid issues during Next.js SSR
// Path aligns with other example imports in this repo (e.g., OrbitControls)
async function createGLTFExporter(): Promise<any> {
  const mod = await import('three/examples/jsm/exporters/GLTFExporter.js');
  return new mod.GLTFExporter();
}

function saveBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.style.display = 'none';
  document.body.appendChild(link);
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

function buildModelFromCode(threejsCode: string): THREE.Object3D {
  // Execute the provided Three.js code to construct the model
  // The code is expected to define and return a variable named `model`
  const generateModel = new Function('THREE', `${threejsCode}\nreturn model;`);
  const result = generateModel(THREE);

  if (!(result instanceof THREE.Object3D)) {
    throw new Error('Generated content is not a valid THREE.Object3D');
  }

  return result as THREE.Object3D;
}

export async function exportModelAsGLBFromCode(
  threejsCode: string,
  filename: string = 'model.glb'
): Promise<void> {
  const exporter = await createGLTFExporter();
  const model = buildModelFromCode(threejsCode);

  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      model,
      (result: ArrayBuffer) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        saveBlob(blob, filename);
        resolve();
      },
      (error: unknown) => {
        reject(error instanceof Error ? error : new Error('Failed to export GLB'));
      },
      { binary: true }
    );
  });
}

export async function exportModelAsGLTFEmbeddedFromCode(
  threejsCode: string,
  filename: string = 'model.gltf'
): Promise<void> {
  const exporter = await createGLTFExporter();
  const model = buildModelFromCode(threejsCode);

  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      model,
      (result: unknown) => {
        // When binary: false, result is a JSON-compatible object
        const json = JSON.stringify(result, null, 2);
        const blob = new Blob([json], { type: 'model/gltf+json' });
        saveBlob(blob, filename);
        resolve();
      },
      (error: unknown) => {
        reject(error instanceof Error ? error : new Error('Failed to export GLTF'));
      },
      {
        binary: false,
        embedImages: true,
        // Include punctual lights extension if present in the scene
        includeCustomExtensions: true,
      }
    );
  });
}

// Export model including animations if present on model.userData.clips
export async function exportAnimatedModelAsGLBFromCode(
  threejsCode: string,
  filename: string = 'model-animated.glb'
): Promise<void> {
  const exporter = await createGLTFExporter();
  const model = buildModelFromCode(threejsCode);

  // Collect animations from userData.clips if available
  const animations = Array.isArray((model as any).userData?.clips)
    ? (model as any).userData.clips.filter((c: unknown) => c instanceof THREE.AnimationClip)
    : [];

  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      model,
      (result: ArrayBuffer) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        saveBlob(blob, filename);
        resolve();
      },
      (error: unknown) => {
        reject(error instanceof Error ? error : new Error('Failed to export animated GLB'));
      },
      { binary: true, animations }
    );
  });
}

export async function exportAnimatedModelAsGLTFEmbeddedFromCode(
  threejsCode: string,
  filename: string = 'model-animated.gltf'
): Promise<void> {
  const exporter = await createGLTFExporter();
  const model = buildModelFromCode(threejsCode);

  const animations = Array.isArray((model as any).userData?.clips)
    ? (model as any).userData.clips.filter((c: unknown) => c instanceof THREE.AnimationClip)
    : [];

  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      model,
      (result: unknown) => {
        const json = JSON.stringify(result, null, 2);
        const blob = new Blob([json], { type: 'model/gltf+json' });
        saveBlob(blob, filename);
        resolve();
      },
      (error: unknown) => {
        reject(error instanceof Error ? error : new Error('Failed to export animated GLTF'));
      },
      { binary: false, embedImages: true, includeCustomExtensions: true, animations }
    );
  });
}

// Convenience overloads if a model instance is already available in the future
export async function exportObjectAsGLB(
  object3D: THREE.Object3D,
  filename: string = 'model.glb'
): Promise<void> {
  const exporter = await createGLTFExporter();
  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      object3D,
      (result: ArrayBuffer) => {
        const blob = new Blob([result], { type: 'model/gltf-binary' });
        saveBlob(blob, filename);
        resolve();
      },
      (error: unknown) => reject(error instanceof Error ? error : new Error('Failed to export GLB')),
      { binary: true }
    );
  });
}

export async function exportObjectAsGLTFEmbedded(
  object3D: THREE.Object3D,
  filename: string = 'model.gltf'
): Promise<void> {
  const exporter = await createGLTFExporter();
  return new Promise<void>((resolve, reject) => {
    exporter.parse(
      object3D,
      (result: unknown) => {
        const json = JSON.stringify(result, null, 2);
        const blob = new Blob([json], { type: 'model/gltf+json' });
        saveBlob(blob, filename);
        resolve();
      },
      (error: unknown) => reject(error instanceof Error ? error : new Error('Failed to export GLTF')),
      { binary: false, embedImages: true, includeCustomExtensions: true }
    );
  });
}

