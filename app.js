import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TubePath } from './TubePath.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);

const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10, 0, 10),
    new THREE.Vector3(-5, 5, 5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, -5, 5),
    new THREE.Vector3(10, 0, 10)
], false, 'chordal');
const geometry = new TubePath(path, undefined, 1, 8, false);
const tube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'green' }));
tube.add(new THREE.LineSegments(new THREE.WireframeGeometry(tube.geometry)));
scene.add(tube);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();
