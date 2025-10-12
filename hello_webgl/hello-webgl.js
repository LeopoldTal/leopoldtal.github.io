const vsSource = `
	attribute vec4 aVertexPosition;
	attribute vec3 aVertexNormal;
	attribute vec2 aTextureCoord;

	uniform float uTime;
	uniform mat4 uNormalMatrix;
	uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;

	varying highp vec2 vTextureCoord;
	varying highp vec3 vLight;

	void main() {
		highp vec4 normal = uNormalMatrix * vec4(aVertexNormal, 1.);

		highp vec3 lightDirection = normalize(vec3(0.5, 0.8, 0.7));
		highp vec3 directLightColor = vec3(0.8 + 0.2 * cos(uTime), 1.0, 0.8);
		highp vec3 ambientLightColor = 0.3 * vec3(0.8, 0.8, 1.0);
		
		highp float directLight = max(dot(normal.xyz, lightDirection), 0.0);

		gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
		vTextureCoord = aTextureCoord;
		vLight = ambientLightColor + directLight * directLightColor;
	}
`;

const fsSource = `
	varying highp vec2 vTextureCoord;
	varying highp vec3 vLight;

	uniform sampler2D uSampler;

	void main() {
		highp vec4 texel = texture2D(uSampler, vTextureCoord);
		gl_FragColor = vec4(texel.rgb * vLight, texel.a);
	}
`;

const loadShader = (gl, type, source) => {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.debug('Loaded shader', type);
		return shader;
	} else {
		console.error('Failed to load shader:', type, gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
};

const initTexture = (gl) => {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// start with 1 pixel
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	return texture;
};

const updateTexture = (gl, texture, video) => {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
};

const initProgram = (gl, { vsSource, fsSource }) => {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
	if (!vertexShader || !fragmentShader) {
		console.error('Missing shader. Aborted.');
		return null;
	}

	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.debug('Linked program');
		return program;
	} else {
		console.error('Failed to link program:', gl.getProgramInfoLog(program));
		return null;
	}
};

const initPositionBuffer = (gl) => {
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const firstCube = [
		// front face
		-.7, -1.0, 1.3,
		.7, -1.0, 1.3,
		.7, 1.0, 1.3,
		-.7, 1.0, 1.3,

		// back face
		-.7, -1.0, -1.3,
		-.7, 1.0, -1.3,
		.7, 1.0, -1.3,
		.7, -1.0, -1.3,

		// top face
		-.7, 1.0, -1.3,
		-.7, 1.0, 1.3,
		.7, 1.0, 1.3,
		.7, 1.0, -1.3,

		// bottom face
		-.7, -1.0, -1.3,
		.7, -1.0, -1.3,
		.7, -1.0, 1.3,
		-.7, -1.0, 1.3,

		// right face
		.7, -1.0, -1.3,
		.7, 1.0, -1.3,
		.7, 1.0, 1.3,
		.7, -1.0, 1.3,

		// left face
		-.7, -1.0, -1.3,
		-.7, -1.0, 1.3,
		-.7, 1.0, 1.3,
		-.7, 1.0, -1.3,
	];
	
	const secondCube = firstCube.map(x => 0.4 * x + 1.2);
	const positions = firstCube.concat(secondCube);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	return positionBuffer;
};

const initNormalBuffer = (gl) => {
	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

	const cubeNormals = [
		// front face
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		// back face
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		// top face
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		// bottom face
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,

		// right face
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		// left face
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
	];
	const normals = cubeNormals.concat(cubeNormals);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

	return normalBuffer;
};

const initTextureBuffer = (gl) => {
	const textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);

	const cubeCoords = [
		// front face
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		// back face
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		// top face
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		// bottom face
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		// right face
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
		// left face
		0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
	];
	const coords = cubeCoords.concat(cubeCoords);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coords), gl.STATIC_DRAW);

	return textureBuffer;
};

const initIndexBuffer = (gl) => {
	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	const firstCubeIndices = [
		// front face
		0, 1, 2,
		0, 2, 3,
		// back face
		4, 5, 6,
		4, 6, 7,
		// top face
		8, 9, 10,
		8, 10, 11,
		// bottom face
		12, 13, 14,
		12, 14, 15,
		// right face
		16, 17, 18,
		16, 18, 19,
		// left face
		20, 21, 22,
		20, 22, 23,
	];
	const secondCubeIndices = firstCubeIndices.map(x => x + 24);
	const indices = firstCubeIndices.concat(secondCubeIndices);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	return indexBuffer;
}

const initBuffers = (gl) => {
	return {
		position: initPositionBuffer(gl),
		normal: initNormalBuffer(gl),
		texture: initTextureBuffer(gl),
		index: initIndexBuffer(gl),
	};
};

const drawScene = (gl, programInfo, buffers, { texture, video }, { rotationRadians, wobbleY, wobbleZ, distanceBob, time }) => {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	const fieldOfView = Math.PI / 180 * 45;
	const aspect = gl.canvas.width / gl.canvas.height;
	const zNear = 0.1;
	const zFar = 100.;

	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix, modelViewMatrix, [0., 0., -6. + distanceBob]);
	mat4.rotate(modelViewMatrix, modelViewMatrix, rotationRadians, [1., wobbleY, wobbleZ]);

	const normalMatrix = mat4.create();
	mat4.invert(normalMatrix, modelViewMatrix);
	mat4.transpose(normalMatrix, normalMatrix);

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	gl.vertexAttribPointer(programInfo.attribLocations.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(programInfo.attribLocations.aVertexPosition);

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
	gl.vertexAttribPointer(programInfo.attribLocations.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(programInfo.attribLocations.aVertexNormal);

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture);
	gl.vertexAttribPointer(programInfo.attribLocations.aTextureCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(programInfo.attribLocations.aTextureCoord);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.index);

	gl.useProgram(programInfo.program);

	gl.uniformMatrix4fv(programInfo.uniformLocations.uProjectionMatrix, false, projectionMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.uModelViewMatrix, false, modelViewMatrix);
	gl.uniformMatrix4fv(programInfo.uniformLocations.uNormalMatrix, false, normalMatrix);
	gl.uniform1f(programInfo.uniformLocations.uTime, time);

	gl.activeTexture(gl.TEXTURE0);
	if (window.playing) {
		updateTexture(gl, texture, video);
	}
	gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

	gl.drawElements(gl.TRIANGLES, 36 * 2, gl.UNSIGNED_SHORT, 0);
};


const watchCamera = async (video) => {
	console.debug('Start watching camera');
	window.playing = false;
	const stream = await navigator.mediaDevices.getUserMedia({ video: true });

	video.addEventListener('canplay', () => {
		console.debug('Start copying video');
		window.playing = true;
	});

	video.srcObject = stream;
	video.play();
};

const main = () => {
	const canvas = document.getElementById('gl-canvas');
	const gl = canvas.getContext('webgl');

	if (!gl) {
		console.error('WebGL not found');
		return;
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const program = initProgram(gl, { vsSource, fsSource });
	if (!program) {
		console.error('Missing program. Aborted.');
		return;
	}

	const programInfo = {
		program,
		attribLocations: {
			aVertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
			aVertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),
			aTextureCoord: gl.getAttribLocation(program, 'aTextureCoord'),
		},
		uniformLocations: {
			uModelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
			uProjectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
			uNormalMatrix: gl.getUniformLocation(program, 'uNormalMatrix'),
			uSampler: gl.getUniformLocation(program, 'uSampler'),
			uTime: gl.getUniformLocation(program, 'uTime'),
		},
	};

	const texture = initTexture(gl);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	const video = document.createElement('video');
	void watchCamera(video);

	const buffers = initBuffers(gl);

	const render = (timestampMs) => {
		const timestampSeconds = timestampMs / 1000;

		const rotationTurns = timestampSeconds / 4.5 % 1;
		const rotationRadians = 2 * Math.PI * rotationTurns;

		const wobbleY = 0.4 * Math.cos(2 * Math.PI * timestampSeconds / 7.2);
		const wobbleZ = 0.3 * Math.cos(2 * Math.PI * timestampSeconds / 8.3);

		const distanceBob = 1.5 * Math.cos(2 * Math.PI * timestampSeconds / 9.3);

		drawScene(gl, programInfo, buffers, { texture, video }, { rotationRadians, wobbleY, wobbleZ, distanceBob, time: timestampSeconds });
		requestAnimationFrame(render);
	};

	console.debug('Start renderer');
	requestAnimationFrame(render);
};

main();
