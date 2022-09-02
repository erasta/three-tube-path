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

// const path = new THREE.SplineCurve(new THREE.Vector3(- 1, - 1, 0), new THREE.Vector3(- 1, 1, 0), new THREE.Vector3(1, 1, 0));
const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-10, 0, 10),
    new THREE.Vector3(-5, 5, 5),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, -5, 5),
    new THREE.Vector3(10, 0, 10)
], false, 'chordal');
const lengths = [0];
path.points.forEach((p, i, arr) => {
    if (i > 0) {
        const last = lengths.at(-1);
        const next = last + p.distanceTo(arr[i - 1]);
        if (i > 1) {
            lengths.push(last + 0.1);
            lengths.push(last + 0.3);
            lengths.push(last + 0.5);
        }
        if (i < arr.length - 1) {
            lengths.push(next - 0.5);
            lengths.push(next - 0.3);
            lengths.push(next - 0.1);
        }
        lengths.push(next);
    }
});

// const lengths1 = [0];
// lengths.forEach((l, i, a) => {
//     if (i > 0) {
//         lengths1.push(lengths1.at(-1) + 0.5);
//         lengths1.push(l - 0.5);
//         lengths1.push(l);
//     }
// })
console.log(lengths);
const uMappingFrames = lengths.map(l => l / lengths.at(-1));
console.log(uMappingFrames);
// const geometry1 = new THREE.TubeGeometry(path, 1, 1, 3, true);
const geometry = new TubePath(path, uMappingFrames, 1, 8, false);

// console.log( 'org', geometry1.index.array);
// console.log( 'new', geometry.index.array);
// console.log( geometry.index.array.findIndex((v, i) => v !== geometry1.index.array[i]));
// function comp(attr) {
//     console.log(attr, 'org', geometry1.attributes[attr].array);
//     console.log(attr, 'new', geometry.attributes[attr].array);
//     console.log(attr, geometry.attributes[attr].array.findIndex((v, i) => v !== geometry1.attributes[attr].array[i]));
// }
// comp('position');
// comp('normal');
// comp('uv');
// geometry.computeBoundingSphere();
const cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 'green' }));
scene.add(cube);
cube.add(new THREE.LineSegments(new THREE.WireframeGeometry(cube.geometry)));

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();
