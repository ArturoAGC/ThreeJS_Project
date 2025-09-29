import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { scene } from './scene.js';

const cloudModels = ['/models/level/clouds.glb', '/models/level/clouds2.glb', '/models/level/clouds3.glb'];
const clouds = [];
const loader = new GLTFLoader();

const CLOUDS_PER_MODEL = 4;

export function loadClouds() {
  cloudModels.forEach((path, modelIndex) => {
    loader.load(path, (gltf) => {
      for (let i = 0; i < CLOUDS_PER_MODEL; i++) {
        const cloud = gltf.scene.clone();
        cloud.name = `cloud_${modelIndex}_${i}`;

        const direction = (i + modelIndex) % 2 === 0 ? 1 : -1;

        const posX = direction === 1
          ? -50 - Math.random() * 40
          : 50 + Math.random() * 30;

        cloud.position.set(
          posX,
          12 + Math.random() * 6,
          -10
        );

        cloud.rotation.y = -Math.PI / 2;
        cloud.scale.set(2, 2, 2);

        scene.add(cloud);
        clouds.push({
          mesh: cloud,
          direction,
          speed: 0.01 + Math.random() * 0.023,
        });
      }
    }, undefined, (error) => {
      console.error(`Error cargando ${path}:`, error);
    });
  });
}

export function updateClouds() {
  clouds.forEach(({ mesh, direction, speed }) => {
    mesh.position.x += speed * direction;

    if (direction === 1 && mesh.position.x > 70) {
      mesh.position.x = -70 - Math.random() * 30;
    } else if (direction === -1 && mesh.position.x < -70) {
      mesh.position.x = 70 + Math.random() * 30;
    }
  });
}