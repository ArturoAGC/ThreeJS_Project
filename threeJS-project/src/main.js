import { scene, camera, renderer } from './scene.js';
import { loadBackground } from './background.js';
import { loadClouds, updateClouds } from './clouds.js';
import { loadFloor } from './floor.js';
import { createPlayer } from './character.js';
import { world } from './physics.js';
import { createWeapons, updateWeaponWiggleBones } from './createWeapons.js';
import { syncList } from './syncList.js';

let lastTime = performance.now();
let player;

document.getElementById('reset-button').addEventListener('click', () => {
  window.location.reload();
});

function animate() {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  world.step(1 / 60);

  // Sincronizar posición entre física y modelo
  for (const { mesh, body } of syncList) {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }

  updateClouds();
  if (player) player.update(deltaTime);

  updateWeaponWiggleBones(); // ✅ Actualizar wiggle bones del arma

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function main() {
  loadBackground();
  loadClouds();
  loadFloor();
  player = createPlayer();     // Jugador con físicas y wiggle
  createWeapons();             // Armas con físicas y wiggle

  animate();
}

main();