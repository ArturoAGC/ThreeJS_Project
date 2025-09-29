import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { scene, camera } from './scene.js';
import { world } from './physics.js';
import { WiggleBone } from 'wiggle';

let playerMesh, playerBody;
let wiggleBones = [];
let rootBone = null;

let isDragging = false;
let mouse = new THREE.Vector2();
let mouseOffset = new THREE.Vector2();
let initialPosition = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

let debugMesh = null;

export function createPlayer() {
  const loader = new GLTFLoader();

  loader.load('./models/demon.glb', (gltf) => {
    playerMesh = gltf.scene;
    playerMesh.scale.set(0.5, 0.5, 0.5);
    playerMesh.name = 'player';
    scene.add(playerMesh);

    // Crear cuerpo físico con forma de caja
    const boxSize = new CANNON.Vec3(0.5, 1, 0.5);
    playerBody = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(0, 10, 15),
    });

    const shape = new CANNON.Box(boxSize);
    // Desplazar la caja hacia arriba para centrarla con el modelo visual
    const shapeOffset = new CANNON.Vec3(0, 1.6, 0);
    playerBody.addShape(shape, shapeOffset);

    world.addBody(playerBody);

    // Crear caja de depuración visual
    const geometry = new THREE.BoxGeometry(boxSize.x * 0, boxSize.y / 0, boxSize.z * 0);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
    debugMesh = new THREE.Mesh(geometry, material);
    scene.add(debugMesh);

    const skinnedMesh = playerMesh.getObjectByProperty("type", "SkinnedMesh");
    if (!skinnedMesh) {
      console.error("No se encontró SkinnedMesh.");
      return;
    }

    // Wiggle bones
    skinnedMesh.skeleton.bones.forEach((bone) => {
      if (!bone.parent.isBone) {
        rootBone = bone;
      } else {
        const wb = new WiggleBone(bone, {
          velocity: 0.5,
          drag: 0.9,
          stiffness: 0.05,
          gravity: new THREE.Vector3(0, -9.8, 0),
        });
        wiggleBones.push(wb);
      }
    });

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });

  function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(playerMesh, true);

    if (intersects.length > 0) {
      isDragging = true;
      mouseOffset.set(mouse.x, mouse.y);
      initialPosition.copy(playerMesh.position);

      playerBody.mass = 0;
      playerBody.updateMassProperties();
      playerBody.velocity.set(0, 0, 0);
      playerBody.angularVelocity.set(0, 0, 0);
    }
  }

  function onMouseMove(event) {
    if (!isDragging) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const delta = new THREE.Vector3().subVectors(mouse, mouseOffset);
    playerMesh.position.set(
      initialPosition.x + delta.x * 5,
      initialPosition.y + delta.y * 5,
      initialPosition.z
    );
    playerBody.position.copy(playerMesh.position);
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      playerBody.mass = 1;
      playerBody.updateMassProperties();
    }
  }

  function update() {
    if (playerMesh && playerBody) {
      // Aplicar el mismo offset para que el debugMesh y playerMesh estén alineados
      const shapeOffset = new CANNON.Vec3(0, 0.5, 0);

      // El cuerpo se mueve con el offset en cuenta
      playerMesh.position.copy(playerBody.position.vadd(shapeOffset));
      playerMesh.quaternion.copy(playerBody.quaternion);

      debugMesh.position.copy(playerBody.position.vadd(shapeOffset));
      debugMesh.quaternion.copy(playerBody.quaternion);

      wiggleBones.forEach((wb) => wb.update());
    }
  }

  return { update };
}