function createShader(gl, type, source) {
    const shader = gl.createShader(type)  // crea
    gl.shaderSource(shader, source)  // linkea con source
    gl.compileShader(shader)  // compila
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (success) return shader

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram()  // crea
    gl.attachShader(program, vertexShader)  // agrega los shaders
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)  // linkea los shaders en un programa
    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (success) return program
    
    console.log(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
}

function fillBufferWithRect(gl, x, y, width, height) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x, y,
        x + width, y,
        x, y + height,
        x, y + height,
        x + width, y,
        x + width, y + height,
    ]), gl.STATIC_DRAW)
}

const vertexShaderSource = 
`#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_resolution;

out vec2 v_texCoord;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
}
`

const fragmentShaderSource = 
`#version 300 es

precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_image;
uniform mat3 u_kernel;

out vec4 outColor;

void main() {
    vec2 onePixel = vec2(1, 1) / vec2(textureSize(u_image, 0));
    vec4 colorSum = vec4(0);

    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            vec2 samplePosition = v_texCoord + vec2(i - 1, j - 1) * onePixel;
            vec4 sampleColor = texture(u_image, samplePosition);
            sampleColor *= u_kernel[i][j];
            colorSum += sampleColor;
        }
    }

    outColor = vec4(colorSum.rgb, 1);
}
`

// General setup
function draw(src, kernel) {
    const image = new Image()
    image.src = src
    image.onload = () => {render(image, kernel)}    
}

function render(image, kernel) {
    const canvas = document.getElementById('c')
    const gl = canvas.getContext('webgl2')
    webglUtils.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    const program = createProgram(gl, vertexShader, fragmentShader)
    
    // Attribute and buffer setup
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)  // Saves state to vao
    
    // Position attribute
    const positionBuffer = gl.createBuffer()  // Creates empty buffer with location for positions
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution')
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    fillBufferWithRect(gl, 200, 50, 600, 600)
    
    gl.enableVertexAttribArray(positionAttributeLocation)  // Turns on attribute
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0) // Tells attribute how to get data out of buffer
    
    // Texture attribute
    const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord")
    const imageLocation = gl.getUniformLocation(program, "u_image")
    
    const texCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0
    ]), gl.STATIC_DRAW)
    
    gl.enableVertexAttribArray(texCoordAttributeLocation)
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0)
    
    // Create a texture
    const texture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + 0, texture)
    
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    
    // Set kernel
    const matrixLocation = gl.getUniformLocation(program, "u_kernel")
    
    // Draw and set uniforms
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    gl.useProgram(program)  // Especifica los shaders
    gl.bindVertexArray(vao)  // Especifica el estado
    
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height)
    gl.uniform1i(imageLocation, 0)
    gl.uniformMatrix3fv(matrixLocation, true, kernel)

    gl.drawArrays(gl.TRIANGLES, 0, 6)  // primitive type, offset, amount of draw calls    
}
