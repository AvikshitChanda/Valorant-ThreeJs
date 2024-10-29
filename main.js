// Imports
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BrightnessContrastShader } from 'three/examples/jsm/shaders/BrightnessContrastShader.js';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import gsap from 'gsap';
// Scene
const scene = new THREE.Scene();
let model;

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true,
  alpha:true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Load HDRI
const rgbeLoader = new RGBELoader();
rgbeLoader.load('./autumn_ground_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
});

// Load 3D Model
const loader = new GLTFLoader();
loader.load(
  './scene.gltf',
  (gltf) => {
    model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(0, -0.5, 0); // Move left (-1 on x-axis) and up (+1 on y-axis)
    scene.add(model);
    
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error) => {
    console.error('An error occurred while loading the model:', error);
  }
);

// Ambient Light (if needed)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Brightness/Contrast ShaderPass
const brightnessContrastPass = new ShaderPass(BrightnessContrastShader);
brightnessContrastPass.uniforms.brightness.value = 0.1; // Increase brightness
brightnessContrastPass.uniforms.contrast.value = 0.2;   // Increase contrast
composer.addPass(brightnessContrastPass);

// Color Correction ShaderPass
const colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
colorCorrectionPass.uniforms.powRGB.value.set(1.2, 1.2, 1.2); // Adjust RGB individually
colorCorrectionPass.uniforms.mulRGB.value.set(1.1, 1.1, 1.1); // Increase overall color intensity
composer.addPass(colorCorrectionPass);

// Resize Handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
// Mouse Move Animation
window.addEventListener('mousemove', (e) => {
  if (model) {
    // Calculate target rotation based on mouse position
    const targetRotationX = (e.clientX / window.innerWidth - 0.5) * Math.PI * 0.4;
    const targetRotationY = (e.clientY / window.innerHeight - 0.5) * Math.PI * 0.4;

    // Use GSAP to smoothly animate to the target rotation values
    gsap.to(model.rotation, {
      x: targetRotationY,
      y: targetRotationX,
      duration: 1.2,      // Duration for smoothness
      ease: 'power2.out'  // Easing for a natural effect
    });
  }
});



// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  // Render with post-processing effects
  composer.render();
}

animate();
