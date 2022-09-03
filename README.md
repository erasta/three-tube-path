# three-tube-path
TubeGeometry for three.js with just as many tubular segments as needed.

![npm](https://img.shields.io/npm/v/three-tube-path?style=plastic)
## Usage

```js
import { TubePath } from 'three-tube-path';
const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-5, -5, 0), new THREE.Vector3(-5, 5, 0), new THREE.Vector3(5, 5, 0)]);
const geometry = new TubePath(path, TubePath.pathToUMapping(path, 3, 0.3), 1, 8, false);
const tube = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 'green' }));
scene.add(tube);
```
### `geometry = new TubePath(path, uMappingFrames, radius, radialSegments, closed)`
Creates a geometry like TubeGeometry for three.js, but instead of uniformly picking points for tubular segments, allows using specific points or spreading a few just around the path original points.
- `path` - (Curve) A 3D path that inherits from the Curve base class.
- `uMappingFrames` - (Vector of Float) - Positions on the path to place tubular points, where 0 is the beginning of the path and 1 is its end. Default is a few positions around each original point, obtained from calling `TubePath.pathToUMapping(path)`, see below.
- `radius` — (Float) The radius of the tube. Default is 1.
- `radialSegments` — (Integer) The number of segments that make up the cross-section. Default is 8.
- `closed` — (Boolean) Is the tube open or closed. Default is false.

### `umap = TubePath.pathToUMapping(path, elbowNum, elbowOffset)`
Utility function for positions mapping for a path, spreading a few points around each original path point, to smooth those elbows.
- `path` - (Curve) A 3D path that inherits from the Curve base class. Same as given to the TubePath constructor.
- `elbowNum` - (Integer) Maximum number of positions to place on each side of an elbow. Default is 2.
- `elbowOffset` - (Float) Distance between one position around an elbow and the next. Default is 0.1.

## Install
```sh
npm install three-tube-path --save
```

## Demo
https://erasta.github.io/three-tube-path

<img src="files/ScreenShot.png" width=500/>

## License

MIT, see [LICENSE](http://github.com/erasta/three-tube-path/blob/master/LICENSE) for details.