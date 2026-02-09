import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const viewer = document.getElementById('viewer');
const openWebcamBtn = document.getElementById('openWebcam');
const webcamModal = document.getElementById('webcamModal');
const webcamAllow = document.getElementById('webcamAllow');
const webcamDeny = document.getElementById('webcamDeny');
const webcamClose = document.getElementById('webcamClose');
const webcamLayer = document.getElementById('webcamLayer');
const webcamVideo = document.getElementById('webcamVideo');
const nextBtn = document.getElementById('nextBtn');
const pageFade = document.querySelector('.page-fade');

if (!viewer) {
  throw new Error('Viewer element not found');
}

function openModal(){
  if(!webcamModal) return;
  webcamModal.classList.add('is-open');
  webcamModal.setAttribute('aria-hidden', 'false');
}

function closeModal(){
  if(!webcamModal) return;
  webcamModal.classList.remove('is-open');
  webcamModal.setAttribute('aria-hidden', 'true');
}

function showWebcamLayer(){
  if(!webcamLayer) return;
  webcamLayer.classList.add('is-active');
  webcamLayer.setAttribute('aria-hidden', 'false');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
  35,
  viewer.clientWidth / viewer.clientHeight,
  0.1,
  100
);
camera.position.set(0, 0.6, 2.6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.physicallyCorrectLights = true;
viewer.appendChild(renderer.domElement);

const status = document.createElement('div');
status.className = 'viewer-status';
status.textContent = 'Chargement du modele...';
viewer.appendChild(status);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 1.4);
scene.add(hemiLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
dirLight.position.set(3, 5, 2);
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-3, 2, 4);
scene.add(fillLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;

let model = null;

function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const cameraDistance = maxDim / (2 * Math.tan(fov / 2));

  camera.position.set(0, maxDim * 0.15, cameraDistance * 1.35);
  camera.near = maxDim / 100;
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.update();
}

const loader = new GLTFLoader();
loader.load(
  'models/CITROUILLE.glb',
  (gltf) => {
    model = gltf.scene;
    scene.add(model);
    fitCameraToObject(model);
    status.remove();
  },
  undefined,
  (error) => {
    console.error('GLB load error', error);
    status.textContent = 'Erreur de chargement du modele.';
  }
);


function onResize() {
  const { clientWidth, clientHeight } = viewer;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

if (openWebcamBtn) {
  openWebcamBtn.addEventListener('click', () => {
    openModal();
  });
}

if (webcamDeny) {
  webcamDeny.addEventListener('click', () => {
    closeModal();
    if(nextBtn){
      nextBtn.classList.add('is-visible');
    }
    // Future: lancer la video/filtre sans webcam.
  });
}

if (webcamClose) {
  webcamClose.addEventListener('click', closeModal);
}

if (webcamModal) {
  webcamModal.addEventListener('click', (event) => {
    if (event.target === webcamModal) closeModal();
  });
}

if (webcamAllow) {
  webcamAllow.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (webcamVideo) {
        webcamVideo.srcObject = stream;
        await webcamVideo.play();
      }
      closeModal();
      showWebcamLayer();
    } catch (err) {
      console.error('Webcam error', err);
      closeModal();
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (pageFade) {
      pageFade.classList.add('is-active');
    }
    const target = nextBtn.getAttribute('href') || 'conclu-video.html';
    setTimeout(() => {
      window.location.href = target;
    }, 2000);
  });
}
