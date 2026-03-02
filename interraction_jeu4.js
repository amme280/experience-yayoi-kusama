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
const webcamFilter = document.getElementById('webcamFilter');
const webcamBackBtn = document.getElementById('webcamBack');
const takePhotoBtn = document.getElementById('takePhoto');
const webcamNextBtn = document.getElementById('webcamNext');
const nextBtn = document.getElementById('nextBtn');
const pageFade = document.querySelector('.page-fade');
let activeFilter = 1;

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
  // Show controls
  const webcamControls = webcamLayer.querySelector('.webcam-controls');
  const webcamGradient = webcamLayer.querySelector('.webcam-gradient');
  if(webcamControls) webcamControls.setAttribute('aria-hidden', 'false');
  if(webcamGradient) webcamGradient.setAttribute('aria-hidden', 'false');
}

function hideWebcamLayer() {
  if (!webcamLayer) return;

  const stream = webcamVideo && webcamVideo.srcObject;
  if (stream && typeof stream.getTracks === 'function') {
    stream.getTracks().forEach((track) => track.stop());
  }

  if (webcamVideo) {
    webcamVideo.srcObject = null;
  }

  webcamLayer.classList.remove('is-active', 'is-filter-2');
  webcamLayer.setAttribute('aria-hidden', 'true');
}

function setActiveFilter(filterNumber) {
  if (!webcamFilter || !webcamLayer) return;
  activeFilter = filterNumber === 2 ? 2 : 1;
  const nextSrc = activeFilter === 2 ? 'images/filtre 2.png' : 'images/filtre 1.png';
  webcamFilter.classList.add('is-fading');
  setTimeout(() => {
    webcamFilter.src = nextSrc;
  }, 120);

  webcamFilter.onload = () => {
    webcamFilter.classList.remove('is-fading');
  };

  setTimeout(() => {
    webcamFilter.classList.remove('is-fading');
  }, 450);

  webcamLayer.classList.toggle('is-filter-2', activeFilter === 2);
  if (webcamNextBtn) {
    webcamNextBtn.setAttribute('aria-label', activeFilter === 2 ? 'Revenir au filtre 1' : 'Passer au filtre 2');
  }
}

function drawCover(ctx, media, targetWidth, targetHeight) {
  const sourceWidth = media.videoWidth || media.naturalWidth || 0;
  const sourceHeight = media.videoHeight || media.naturalHeight || 0;
  if (!sourceWidth || !sourceHeight) return;

  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let cropX = 0;
  let cropY = 0;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
    cropX = (sourceWidth - cropWidth) / 2;
  } else {
    cropHeight = sourceWidth / targetRatio;
    cropY = (sourceHeight - cropHeight) / 2;
  }

  ctx.drawImage(
    media,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );
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
      setActiveFilter(1);
      showWebcamLayer();
    } catch (err) {
      console.error('Webcam error', err);
      closeModal();
    }
  });
}

if (takePhotoBtn) {
  takePhotoBtn.addEventListener('click', () => {
    if (!webcamVideo || !webcamLayer) return;
    
    const canvas = document.createElement('canvas');
    const outputWidth = webcamLayer.clientWidth;
    const outputHeight = webcamLayer.clientHeight;
    if (!outputWidth || !outputHeight) return;

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawCover(ctx, webcamVideo, outputWidth, outputHeight);
    
    if (webcamFilter && webcamFilter.complete) {
      drawCover(ctx, webcamFilter, outputWidth, outputHeight);
    }
    
    // Download image
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kusama-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
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

if (webcamNextBtn) {
  webcamNextBtn.addEventListener('click', (event) => {
    event.preventDefault();
    setActiveFilter(activeFilter === 1 ? 2 : 1);
  });
}

if (webcamBackBtn) {
  webcamBackBtn.addEventListener('click', () => {
    hideWebcamLayer();
  });
}
