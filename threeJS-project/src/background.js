import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene, camera } from './scene.js';

export function loadBackground() {
  const loader = new GLTFLoader();
  loader.load('/models/level/background.glb', (gltf) => {
    const castle = gltf.scene;
    castle.name = 'castle';

    // Posición más centrada
    castle.position.set(0, -5, 0);

    // Escala razonable
    castle.scale.set(0.5, 0.5, 0.5);

    // Rotación si hace falta
    castle.rotation.y = -Math.PI / 2;

    camera.position.z = 20;
    scene.add(castle);
  }, undefined, (error) => {
    console.error('Error al cargar el fondo (castle):', error);
  });
}