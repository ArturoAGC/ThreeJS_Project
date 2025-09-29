import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { scene } from './scene.js';
import { world } from './physics.js';

export function loadFloor() {
  const loader = new GLTFLoader();
  
  loader.load('/models/level/floor.glb', (gltf) => {
    const floor = gltf.scene;
    floor.name = 'floor';

    // Posición, rotación y escala del modelo
    floor.position.set(0, -5, 0);
    floor.scale.set(0.7, 0.7, 0.7);
    floor.rotation.y = -Math.PI / 2;

    scene.add(floor);

    // === Piso físico invisible ===
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({
      mass: 0, // estático
      shape: floorShape
    });

    // Rotarlo como el modelo visual (para que apunte hacia arriba)
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

    // Moverlo a la misma posición Y que el modelo (coincidir altura)
    floorBody.position.set(0, -5, 0);

    world.addBody(floorBody);
  }, undefined, (error) => {
    console.error('Error al cargar el suelo:', error);
  });
}