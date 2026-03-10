import { describe, it, expect } from 'vitest';
import { CatmullRomCurve3, Vector3 } from 'three';
import { TubePath } from './TubePath.ts';

const simplePath = new CatmullRomCurve3([
	new Vector3(-1, -1, 0),
	new Vector3(-1, 1, 0),
	new Vector3(1, 1, 0),
]);

describe('pathToUMapping', () => {
	it('starts at 0 and ends at 1', () => {
		const mapping = TubePath.pathToUMapping(simplePath);
		expect(mapping[0]).toBe(0);
		expect(mapping[mapping.length - 1]).toBe(1);
	});

	it('values are monotonically increasing', () => {
		const mapping = TubePath.pathToUMapping(simplePath);
		for (let i = 1; i < mapping.length; i++) {
			expect(mapping[i]).toBeGreaterThan(mapping[i - 1]);
		}
	});

	it('produces more segments with higher elbowSegmentNum', () => {
		const few = TubePath.pathToUMapping(simplePath, 1, 0.1);
		const many = TubePath.pathToUMapping(simplePath, 5, 0.1);
		expect(many.length).toBeGreaterThan(few.length);
	});

	it('works with a 2-point path', () => {
		const twoPoint = new CatmullRomCurve3([
			new Vector3(0, 0, 0),
			new Vector3(1, 0, 0),
		]);
		const mapping = TubePath.pathToUMapping(twoPoint);
		expect(mapping[0]).toBe(0);
		expect(mapping[mapping.length - 1]).toBe(1);
	});

	it('works with default arguments', () => {
		const mapping = TubePath.pathToUMapping();
		expect(mapping.length).toBeGreaterThanOrEqual(2);
		expect(mapping[0]).toBe(0);
		expect(mapping[mapping.length - 1]).toBe(1);
	});
});

describe('TubePath constructor', () => {
	it('creates geometry with default parameters', () => {
		const tube = new TubePath();
		expect(tube.type).toBe('TubePath');
		expect(tube.getAttribute('position')).toBeDefined();
		expect(tube.getAttribute('normal')).toBeDefined();
		expect(tube.getAttribute('uv')).toBeDefined();
		expect(tube.index).not.toBeNull();
	});

	it('stores parameters', () => {
		const tube = new TubePath(simplePath, undefined, 0.5, 12, false);
		expect(tube.parameters.path).toBe(simplePath);
		expect(tube.parameters.radius).toBe(0.5);
		expect(tube.parameters.radialSegments).toBe(12);
		expect(tube.parameters.closed).toBe(false);
	});

	it('exposes frenet frames', () => {
		const tube = new TubePath(simplePath);
		expect(tube.tangents.length).toBeGreaterThan(0);
		expect(tube.normals.length).toBe(tube.tangents.length);
		expect(tube.binormals.length).toBe(tube.tangents.length);
	});

	it('generates correct vertex count', () => {
		const radialSegments = 6;
		const mapping = TubePath.pathToUMapping(simplePath);
		const tube = new TubePath(simplePath, mapping, 0.3, radialSegments);
		const positions = tube.getAttribute('position');
		const expectedVertices = mapping.length * (radialSegments + 1);
		expect(positions.count).toBe(expectedVertices);
	});

	it('generates correct index count', () => {
		const radialSegments = 6;
		const mapping = TubePath.pathToUMapping(simplePath);
		const tube = new TubePath(simplePath, mapping, 0.3, radialSegments);
		const expectedTriangles = (mapping.length - 1) * radialSegments * 2;
		expect(tube.index!.count).toBe(expectedTriangles * 3);
	});

	it('accepts explicit uMappingFrames', () => {
		const mapping = [0, 0.25, 0.5, 0.75, 1];
		const tube = new TubePath(simplePath, mapping, 0.3, 8, false);
		expect(tube.tangents.length).toBe(mapping.length);
	});

	it('works with closed path', () => {
		const closedPath = new CatmullRomCurve3([
			new Vector3(1, 0, 0),
			new Vector3(0, 1, 0),
			new Vector3(-1, 0, 0),
			new Vector3(0, -1, 0),
		]);
		const mapping = TubePath.pathToUMapping(closedPath);
		const tube = new TubePath(closedPath, mapping, 0.3, 8, true);
		expect(tube.getAttribute('position')).toBeDefined();
	});
});

describe('geometry validity', () => {
	it('all normals are unit length', () => {
		const tube = new TubePath(simplePath);
		const normals = tube.getAttribute('normal');
		for (let i = 0; i < normals.count; i++) {
			const len = Math.sqrt(
				normals.getX(i) ** 2 + normals.getY(i) ** 2 + normals.getZ(i) ** 2,
			);
			expect(len).toBeCloseTo(1, 4);
		}
	});

	it('frenet tangents are unit length', () => {
		const tube = new TubePath(simplePath);
		for (const t of tube.tangents) {
			expect(t.length()).toBeCloseTo(1, 4);
		}
	});

	it('frenet normals are perpendicular to tangents', () => {
		const tube = new TubePath(simplePath);
		for (let i = 0; i < tube.tangents.length; i++) {
			const dot = tube.tangents[i].dot(tube.normals[i]);
			expect(dot).toBeCloseTo(0, 4);
		}
	});

	it('vertices lie at the specified radius from the path', () => {
		const radius = 0.5;
		const mapping = [0, 0.5, 1];
		const tube = new TubePath(simplePath, mapping, radius, 8);
		const positions = tube.getAttribute('position');

		for (const u of mapping) {
			const center = simplePath.getPointAt(u);
			const segIdx = mapping.indexOf(u);
			const start = segIdx * 9; // (8+1) vertices per segment
			const pos = new Vector3(
				positions.getX(start),
				positions.getY(start),
				positions.getZ(start),
			);
			expect(pos.distanceTo(center)).toBeCloseTo(radius, 3);
		}
	});

	it('uvs span 0 to 1', () => {
		const tube = new TubePath(simplePath);
		const uvs = tube.getAttribute('uv');
		let minU = Infinity, maxU = -Infinity;
		let minV = Infinity, maxV = -Infinity;
		for (let i = 0; i < uvs.count; i++) {
			minU = Math.min(minU, uvs.getX(i));
			maxU = Math.max(maxU, uvs.getX(i));
			minV = Math.min(minV, uvs.getY(i));
			maxV = Math.max(maxV, uvs.getY(i));
		}
		expect(minU).toBeCloseTo(0);
		expect(maxU).toBeCloseTo(1);
		expect(minV).toBeCloseTo(0);
		expect(maxV).toBeCloseTo(1);
	});
});

describe('toJSON / fromJSON', () => {
	it('round-trips a CatmullRomCurve3 tube', () => {
		const original = new TubePath(simplePath, undefined, 0.4, 6, false);
		const json = original.toJSON();
		expect(json.path).toBeDefined();
		expect(json.path.type).toBe('CatmullRomCurve3');
	});

	it('fromJSON throws on unknown curve type', () => {
		expect(() => TubePath.fromJSON({
			path: { type: 'UnknownCurve' },
			uMappingFrames: [0, 1],
			radius: 0.3,
			radialSegments: 8,
			closed: false,
		})).toThrow('Unknown curve type');
	});
});
