import * as THREE from 'three';
import { RoomEnvironment } from './node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { TubePath } from './TubePath.js';
import { GUI } from './node_modules/three/examples/jsm/libs/lil-gui.module.min.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2.5, 5, 35);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment()).texture;
scene.background = new THREE.Color(0x888888);

const gui = new GUI();

const params = {
    numberOfPoints: 5,
    radialSegments: 8,
    elbowNum: 3,
    elbowOffset: 0.5,
    radius: 1,
    wireframe: true,
};

gui.add(params, 'numberOfPoints').min(2).max(10).step(1).onChange(randomize);
gui.add(params, 'radialSegments').min(3).max(24).step(1).onChange(recreate);
gui.add(params, 'elbowNum').name('elbowSegmentNum').min(0).max(10).step(1).onChange(recreate);
gui.add(params, 'elbowOffset').name('elbowOffSegmentset').min(0.01).max(1).step(0.01).onChange(recreate);
gui.add(params, 'radius').min(0.1).max(5).step(0.01).onChange(recreate);
gui.add(params, 'wireframe').onChange(v => tube.wire.visible = v);

const tube = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 'green', side: THREE.DoubleSide }));
scene.add(tube);

let points = [[-10, 0, 10], [-5, 5, 5], [0, 0, 0], [5, -5, 5], [10, 0, 10]].map(x => new THREE.Vector3().fromArray(x));

function randomize() {
    points = [new THREE.Vector3()];
    for (let i = 0; i < params.numberOfPoints; ++i) {
        const dir = new THREE.Vector3().randomDirection().multiplyScalar(5);
        points.push(dir.add(points.at(-1)));
    }
    recreate();
}

function recreate() {
    const path = new THREE.CatmullRomCurve3(points, false, 'chordal');
    tube.geometry = new TubePath(path, TubePath.pathToUMapping(path, params.elbowNum, params.elbowOffset), params.radius, params.radialSegments, false);
    if (!tube.wire) {
        tube.wire = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 'cyan' }));
        tube.wire.visible = params.wireframe;
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
