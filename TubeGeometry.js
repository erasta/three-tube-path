import {
	BufferGeometry,
	Float32BufferAttribute,
	MathUtils,
	Matrix4,
	QuadraticBezierCurve3,
	Vector2,
	Vector3
} from 'three';

class TubeGeometry extends BufferGeometry {

	constructor(path = new QuadraticBezierCurve3(new Vector3(- 1, - 1, 0), new Vector3(- 1, 1, 0), new Vector3(1, 1, 0)),
		uMappingFrames = Array(64).fill().map((x, i, arr) => i / (arr.length - 1)),
		radius = 1,
		radialSegments = 8,
		closed = false) {

		super();

		this.type = 'TubeGeometry';

		this.parameters = {
			path: path,
			uMappingFrames: uMappingFrames,
			radius: radius,
			radialSegments: radialSegments,
			closed: closed
		};

		const frames = this.computeFrenetFrames( path, uMappingFrames, closed );

		// expose internals

		this.tangents = frames.tangents;
		this.normals = frames.normals;
		this.binormals = frames.binormals;

		// helper variables

		const vertex = new Vector3();
		const normal = new Vector3();
		const uv = new Vector2();
		let P = new Vector3();

		// buffer

		const vertices = [];
		const normals = [];
		const uvs = [];
		const indices = [];

		// create buffer data

		generateBufferData();

		// build geometry

		this.setIndex( indices );
		this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
		this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

		// functions

		function generateBufferData() {

			for ( let i = 0; i < uMappingFrames.length - 1; i ++ ) {

				generateSegment( i );

			}

			// if the geometry is not closed, generate the last row of vertices and normals
			// at the regular position on the given path
			//
			// if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

			generateSegment( ( closed === false ) ? uMappingFrames.length - 1 : 0 );

			// uvs are generated in a separate function.
			// this makes it easy compute correct values for closed geometries

			generateUVs();

			// finally create faces

			generateIndices();

		}

		function generateSegment( i ) {

			// we use getPointAt to sample evenly distributed points from the given path

			P = path.getPointAt( uMappingFrames[ i ], P );

			// retrieve corresponding normal and binormal

			const N = frames.normals[ i ];
			const B = frames.binormals[ i ];

			// generate normals and vertices for the current segment

			for ( let j = 0; j <= radialSegments; j ++ ) {

				const v = j / radialSegments * Math.PI * 2;

				const sin = Math.sin( v );
				const cos = - Math.cos( v );

				// normal

				normal.x = ( cos * N.x + sin * B.x );
				normal.y = ( cos * N.y + sin * B.y );
				normal.z = ( cos * N.z + sin * B.z );
				normal.normalize();

				normals.push( normal.x, normal.y, normal.z );

				// vertex

				vertex.x = P.x + radius * normal.x;
				vertex.y = P.y + radius * normal.y;
				vertex.z = P.z + radius * normal.z;

				vertices.push( vertex.x, vertex.y, vertex.z );

			}

		}

		function generateIndices() {

			for ( let j = 1; j <= uMappingFrames.length - 1; j ++ ) {

				for ( let i = 1; i <= radialSegments; i ++ ) {

					const a = ( radialSegments + 1 ) * ( j - 1 ) + ( i - 1 );
					const b = ( radialSegments + 1 ) * j + ( i - 1 );
					const c = ( radialSegments + 1 ) * j + i;
					const d = ( radialSegments + 1 ) * ( j - 1 ) + i;

					// faces

					indices.push( a, b, d );
					indices.push( b, c, d );

				}

			}

		}

		function generateUVs() {

			for ( let i = 0; i <= uMappingFrames.length - 1; i ++ ) {

				for ( let j = 0; j <= radialSegments; j ++ ) {

					uv.x = i / (uMappingFrames.length - 1);
					uv.y = j / radialSegments;

					uvs.push( uv.x, uv.y );

				}

			}

		}

	}

	computeFrenetFrames( path, uMappingFrames, closed ) {

		// see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

		const normal = new Vector3();

		const tangents = [];
		const normals = [];
		const binormals = [];

		const vec = new Vector3();
		const mat = new Matrix4();

		const segments = uMappingFrames.length - 1;

		// compute the tangent vectors for each segment on the curve

		for ( let i = 0; i <= segments; i ++ ) {

			const u = uMappingFrames[ i ];

			tangents[ i ] = path.getTangentAt( u, new Vector3() );

		}

		// select an initial normal vector perpendicular to the first tangent vector,
		// and in the direction of the minimum tangent xyz component

		normals[ 0 ] = new Vector3();
		binormals[ 0 ] = new Vector3();
		let min = Number.MAX_VALUE;
		const tx = Math.abs( tangents[ 0 ].x );
		const ty = Math.abs( tangents[ 0 ].y );
		const tz = Math.abs( tangents[ 0 ].z );

		if ( tx <= min ) {

			min = tx;
			normal.set( 1, 0, 0 );

		}

		if ( ty <= min ) {

			min = ty;
			normal.set( 0, 1, 0 );

		}

		if ( tz <= min ) {

			normal.set( 0, 0, 1 );

		}

		vec.crossVectors( tangents[ 0 ], normal ).normalize();

		normals[ 0 ].crossVectors( tangents[ 0 ], vec );
		binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


		// compute the slowly-varying normal and binormal vectors for each segment on the curve

		for ( let i = 1; i <= segments; i ++ ) {

			normals[ i ] = normals[ i - 1 ].clone();

			binormals[ i ] = binormals[ i - 1 ].clone();

			vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

			if ( vec.length() > Number.EPSILON ) {

				vec.normalize();

				const theta = Math.acos( MathUtils.clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

				normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

			}

			binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

		}

		// if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

		if ( closed === true ) {

			let theta = Math.acos( MathUtils.clamp( normals[ 0 ].dot( normals[ segments ] ), - 1, 1 ) );
			theta /= segments;

			if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ segments ] ) ) > 0 ) {

				theta = - theta;

			}

			for ( let i = 1; i <= segments; i ++ ) {

				// twist a little...
				normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
				binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

			}

		}

		return {
			tangents: tangents,
			normals: normals,
			binormals: binormals
		};

	}

	toJSON() {

		const data = super.toJSON();

		data.path = this.parameters.path.toJSON();

		return data;

	}

	static fromJSON( data ) {

		// This only works for built-in curves (e.g. CatmullRomCurve3).
		// User defined curves or instances of CurvePath will not be deserialized.
		return new TubeGeometry(
			new Curves[ data.path.type ]().fromJSON( data.path ),
			data.tubularSegments,
			data.radius,
			data.radialSegments,
			data.closed
		);

	}

}


export { TubeGeometry };
