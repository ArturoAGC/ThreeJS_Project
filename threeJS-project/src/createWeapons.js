// Importaciones principales
import * as THREE from 'three'; // Motor de render 3D
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Cargar modelos GLTF/GLB
import * as CANNON from 'cannon-es'; // Motor de físicas
import { scene, camera } from './scene.js'; // Escena y cámara compartida
import { world } from './physics.js'; // Mundo físico compartido
import { syncList } from './syncList.js'; // Lista para sincronizar objetos (mesh ↔ body)
import { WiggleBone } from 'wiggle'; // Librería para animar huesos con físicas suaves

// Array para almacenar todos los huesos wiggle activos
const wiggleBones = [];

// Variables para arrastrar armas con el mouse
let draggingWeapon = null; // Arma que se está arrastrando actualmente
let dragOffset = new THREE.Vector2(); // Offset inicial del mouse
let dragStartPosition = new THREE.Vector3(); // Posición inicial del arma al empezar el drag
const raycaster = new THREE.Raycaster(); // Raycaster para detectar clic sobre objetos
const mouse = new THREE.Vector2(); // Coordenadas del mouse normalizadas

// =====================================================
// 1. Caja de depuración para visualizar el collider del arma
// =====================================================
function createWeaponDebugBox(body, halfExtents) {
  // Caja de debug con el mismo tamaño que el collider
  const geometry = new THREE.BoxGeometry(
    halfExtents.x * 2,
    halfExtents.y,
    halfExtents.z * 2
  );
  const material = new THREE.MeshBasicMaterial({
    color: 0x0000ff, // Azul
    wireframe: true, // Solo líneas
    transparent: true,
    opacity: 0.5 // Semi-transparente
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Devuelve una función que actualiza la posición y rotación del debug box
  return function updateDebugBox() {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  };
}

// =====================================================
// 2. Función para añadir un arma con físicas
// =====================================================
function addWeaponWithPhysics(modelPath, position, scale = 1, mass = 5) {
  const loader = new GLTFLoader();

  loader.load(modelPath, (gltf) => {
    const weapon = gltf.scene;
    weapon.scale.set(scale, scale, scale); // Escalamos el modelo
    weapon.position.copy(position); // Lo colocamos en la posición indicada
    scene.add(weapon);

    // Creamos una caja delimitadora para calcular el tamaño real del modelo
    const box = new THREE.Box3().setFromObject(weapon);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Definimos el collider en Cannon (caja)
    // Nota: se ajusta al tamaño del modelo, pero aquí el eje Y está dividido entre 2
    const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 8);
    const shape = new CANNON.Box(halfExtents);

    // Creamos el cuerpo físico
    const body = new CANNON.Body({
      mass: mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: shape
    });

    // Lo añadimos al mundo físico
    world.addBody(body);

    // Sincronizamos el mesh con el cuerpo físico
    const syncItem = { mesh: weapon, body: body, mass: mass };
    syncItem.updateDebugBox = createWeaponDebugBox(body, halfExtents);
    syncList.push(syncItem);

    // Si el modelo es "macesBones4.glb", añadimos wiggle bones a sus huesos
    if (modelPath.includes('macesBones4')) {
      const skinnedMesh = weapon.getObjectByProperty("type", "SkinnedMesh");
      if (skinnedMesh && skinnedMesh.skeleton) {
        skinnedMesh.skeleton.bones.forEach((bone) => {
          if (bone.parent.isBone) {
            const wb = new WiggleBone(bone, {
              velocity: 0.5,
              drag: 0.9,
              stiffness: 0.05,
              gravity: new THREE.Vector3(0, -9.8, 0),
            });
            wiggleBones.push(wb);
          }
        });
      }
    }
  });
}

// =====================================================
// 3. Función para crear todas las armas
// =====================================================
export function createWeapons() {
  const loader = new GLTFLoader();

  // Cargamos un martillo simple sin físicas
  loader.load('/models/weapons/hammer.glb', (gltf) => {
    const hammer = gltf.scene;
    hammer.position.set(0, 0, 0);
    hammer.scale.set(1, 1, 1);
    scene.add(hammer);
  });

  // Añadimos un arma con físicas (mace con huesos wiggle)
  //addWeaponWithPhysics('/models/weapons/macesBones4.glb', new THREE.Vector3(-5, 5, 12), 2, 6);

  // 🔹 Otras armas están comentadas pero puedes habilitarlas cuando quieras
  /*
  addWeaponWithPhysics('/models/weapons/sword.glb', new THREE.Vector3(2, 5, 14), 2.5, 5);
  addWeaponWithPhysics('/models/weapons/sword2.glb', new THREE.Vector3(3, 5, 13), 2.5, 5);
  addWeaponWithPhysics('/models/weapons/sword3.glb', new THREE.Vector3(4, 5, 13), 2.5, 5);
  addWeaponWithPhysics('/models/weapons/axes.glb', new THREE.Vector3(5, 5, 13), 2, 6);
  addWeaponWithPhysics('/models/weapons/axes2.glb', new THREE.Vector3(6, 5, 13), 2, 6);
  addWeaponWithPhysics('/models/weapons/axes3.glb', new THREE.Vector3(7, 5, 13), 2, 6);
  addWeaponWithPhysics('/models/weapons/hammer.glb', new THREE.Vector3(-2, 5, 13), 2, 6);
  addWeaponWithPhysics('/models/weapons/hammer2.glb', new THREE.Vector3(-3, 5, 13), 2, 6);
  addWeaponWithPhysics('/models/weapons/hammer3.glb', new THREE.Vector3(-4, 5, 13), 2, 6);
  addWeaponWithPhysics('/models/weapons/maces.glb', new THREE.Vector3(-5, 5, 13), 2, 6);
  */
}

// =====================================================
// 4. Actualizar wiggle bones y debug boxes
// =====================================================
export function updateWeaponWiggleBones() {
  // Actualizamos todos los wiggle bones
  wiggleBones.forEach((wb) => wb.update());

  // Actualizamos las cajas de debug de los colliders
  syncList.forEach((item) => {
    if (item.updateDebugBox) item.updateDebugBox();
  });
}

// =====================================================
// 5. Eventos para arrastrar armas con el mouse
// =====================================================

// Cuando presionamos el mouse
window.addEventListener('mousedown', (event) => {
  // Normalizamos la posición del mouse
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Lanzamos un rayo desde la cámara hacia la posición del mouse
  raycaster.setFromCamera(mouse, camera);

  // Recorremos todos los objetos sincronizados
  for (let item of syncList) {
    if (!item.mesh) continue;

    // Detectamos si el rayo intersecta con el arma
    const intersects = raycaster.intersectObject(item.mesh, true);
    if (intersects.length > 0) {
      draggingWeapon = item; // Guardamos el arma seleccionada
      dragOffset.set(mouse.x, mouse.y); // Guardamos offset del mouse
      dragStartPosition.copy(item.mesh.position); // Posición inicial del arma

      // Ponemos la masa en 0 para que no le afecte la física al arrastrar
      item.body.mass = 0;
      item.body.updateMassProperties();
      item.body.velocity.set(0, 0, 0);
      item.body.angularVelocity.set(0, 0, 0);
      break;
    }
  }
});

// Cuando movemos el mouse
window.addEventListener('mousemove', (event) => {
  if (!draggingWeapon) return; // Si no hay arma arrastrada, no hacemos nada

  // Normalizamos posición del mouse
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Calculamos el delta del movimiento
  const delta = new THREE.Vector2().subVectors(mouse, dragOffset);

  // Movemos la posición del arma en función del delta
  draggingWeapon.mesh.position.set(
    dragStartPosition.x + delta.x * 5,
    dragStartPosition.y + delta.y * 5,
    dragStartPosition.z
  );
  // Actualizamos la posición del cuerpo físico
  draggingWeapon.body.position.copy(draggingWeapon.mesh.position);
});

// Cuando soltamos el mouse
window.addEventListener('mouseup', () => {
  if (draggingWeapon) {
    // Restauramos la masa original para que la física vuelva a aplicarse
    draggingWeapon.body.mass = draggingWeapon.mass;
    draggingWeapon.body.updateMassProperties();
    draggingWeapon = null; // Dejamos de arrastrar
  }
});