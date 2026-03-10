import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TubePath } from 'three-tube-path';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2.5, 5, 35);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
new OrbitControls(camera, renderer.domElement);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment()).texture;
scene.background = new THREE.Color(0x888888);

let points = [[-10, 0, 10], [-5, 5, 5], [0, 0, 0], [5, -5, 5], [10, 0, 10]].map(x => new THREE.Vector3().fromArray(x));

const tube = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 'green', side: THREE.DoubleSide }));
scene.add(tube);
let wire: THREE.LineSegments | undefined;

function val(id: string): number { return parseFloat((document.getElementById(id) as HTMLInputElement).value); }

function randomize() {
    const n = val('numberOfPoints');
    points = [new THREE.Vector3()];
    for (let i = 1; i < n; ++i) {
        const dir = new THREE.Vector3().randomDirection().multiplyScalar(5);
        points.push(dir.add(points[points.length - 1]));
    }
    recreate();
}

function recreate() {
    const path = new THREE.CatmullRomCurve3(points, false, 'chordal');
    tube.geometry = new TubePath(
        path,
        TubePath.pathToUMapping(path, val('elbowNum'), val('elbowOffset')),
        val('radius'),
        val('radialSegments'),
        false,
    );
    if (!wire) {
        wire = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 'cyan' }));
        tube.add(wire);
    }
    wire.visible = (document.getElementById('wireframe') as HTMLInputElement).checked;
    wire.geometry = new THREE.WireframeGeometry(tube.geometry);
}

// bind controls
for (const input of document.querySelectorAll<HTMLInputElement>('#controls input[type=range]')) {
    input.addEventListener('input', () => {
        const span = document.getElementById(`${input.id}-val`);
        if (span) span.textContent = input.value;
        if (input.id === 'numberOfPoints' && val('numberOfPoints') !== points.length) {
            randomize();
        } else {
            recreate();
        }
    });
}
document.getElementById('wireframe')!.addEventListener('change', recreate);
document.getElementById('randomize')!.addEventListener('click', randomize);

recreate();

(function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
})();
