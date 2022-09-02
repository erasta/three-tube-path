import * as THREE from 'three';
import { RoomEnvironment } from './node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TubePath } from './TubePath.js';
import { GUI } from './node_modules/three/examples/jsm/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 20);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment()).texture;
scene.background = new THREE.Color(0x888888);

const gui = new GUI();

const params = {
    radialSegments: 8,
    wireframe: true,
};

gui.add(params, 'radialSegments').min(3).max(24).step(1).onChange(recreate);
gui.add(params, 'wireframe').onChange(v => tube.wire.visible = v);

const tube = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 'green', side: THREE.DoubleSide }));
scene.add(tube);

function recreate() {
    const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-10, 0, 10),
        new THREE.Vector3(-5, 5, 5),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(5, -5, 5),
        new THREE.Vector3(10, 0, 10)
    ], false, 'chordal');
    tube.geometry = new TubePath(path, undefined, 1, params.radialSegments, false);
    if (!tube.wire) {
        tube.wire = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 'cyan' }));
        tube.add(tube.wire);
    }
    tube.wire.geometry = new THREE.WireframeGeometry(tube.geometry);
}

recreate();

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();
