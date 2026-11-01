import React, { useEffect, useRef } from 'react';

/**
 * AiBlob Component
 * Animated 3D organic blob with customizable colors, dynamic simplex noise vertex deformation,
 * specular lighting, and iridescent glow effects (inspired by React Bits Pro).
 */
export const AiBlob = ({
  size = 28,
  className = '',
  color1 = '#8b5cf6', // Violet
  color2 = '#ec4899', // Pink / Fuchsia
  color3 = '#06b6d4', // Cyan
  glowColor = 'rgba(147, 51, 234, 0.45)',
  speed = 1.0,
  roughness = 0.4,
  amplitude = 0.25,
  glow = true,
  interactive = false
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return;

    // Vertex shader with 3D noise displacement
    const vsSource = `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      uniform mat4 u_projection;
      uniform mat4 u_modelView;
      uniform float u_time;
      uniform float u_speed;
      uniform float u_roughness;
      uniform float u_amplitude;

      varying vec3 v_normal;
      varying vec3 v_position;
      varying vec2 v_uv;
      varying float v_displacement;

      // 3D Simplex-style noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        v_uv = uv;
        
        float t = u_time * u_speed;
        
        // Multi-frequency noise displacement for organic 3D fluid shape
        float n1 = snoise(position * (1.8 * u_roughness) + vec3(t * 0.7, t * 0.5, t * 0.3));
        float n2 = snoise(position * (3.5 * u_roughness) - vec3(t * 0.4, t * 0.8, t * 0.6)) * 0.5;
        float displacement = (n1 + n2) * u_amplitude;
        v_displacement = displacement;

        vec3 newPos = position + normal * displacement;
        v_position = newPos;
        v_normal = normalize(normal + vec3(n1 * 0.3, n2 * 0.3, (n1+n2) * 0.2));

        gl_Position = u_projection * u_modelView * vec4(newPos, 1.0);
      }
    `;

    // Fragment shader with iridescent gradient, specular highlights & Fresnel glow
    const fsSource = `
      precision highp float;

      varying vec3 v_normal;
      varying vec3 v_position;
      varying vec2 v_uv;
      varying float v_displacement;

      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      uniform float u_time;

      void main() {
        vec3 normal = normalize(v_normal);
        vec3 viewDir = normalize(-v_position);
        
        // Fresnel rim factor
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.2);
        
        // Dynamic iridescent color blending based on normals, UVs and displacement
        float factor1 = sin(normal.x * 2.5 + normal.y * 2.0 + u_time * 0.8) * 0.5 + 0.5;
        float factor2 = cos(normal.z * 3.0 + v_displacement * 4.0 + u_time * 0.6) * 0.5 + 0.5;

        vec3 baseColor = mix(u_color1, u_color2, factor1);
        baseColor = mix(baseColor, u_color3, factor2);

        // Specular highlight
        vec3 lightDir = normalize(vec3(0.6, 1.0, 0.8));
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0) * 0.3 + 0.7;

        // Final color assembly with vibrant glow & specular
        vec3 finalColor = baseColor * diff + vec3(spec * 0.6) + (u_color2 * fresnel * 0.8);
        
        gl_FragColor = vec4(finalColor, 0.95 + fresnel * 0.05);
      }
    `;

    // Shader compilation helpers
    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    // Generate UV Sphere Geometry
    const latBands = 32;
    const longBands = 32;
    const radius = 0.85;

    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let lat = 0; lat <= latBands; lat++) {
      const theta = (lat * Math.PI) / latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let long = 0; long <= longBands; long++) {
        const phi = (long * 2 * Math.PI) / longBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;

        const u = 1 - long / longBands;
        const v = 1 - lat / latBands;

        normals.push(x, y, z);
        uvs.push(u, v);
        positions.push(radius * x, radius * y, radius * z);
      }
    }

    for (let lat = 0; lat < latBands; lat++) {
      for (let long = 0; long < longBands; long++) {
        const first = lat * (longBands + 1) + long;
        const second = first + longBands + 1;

        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    // Buffers
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    const idxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Uniform locations
    const uProjLoc = gl.getUniformLocation(program, 'u_projection');
    const uModelViewLoc = gl.getUniformLocation(program, 'u_modelView');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uSpeedLoc = gl.getUniformLocation(program, 'u_speed');
    const uRoughnessLoc = gl.getUniformLocation(program, 'u_roughness');
    const uAmplitudeLoc = gl.getUniformLocation(program, 'u_amplitude');
    const uColor1Loc = gl.getUniformLocation(program, 'u_color1');
    const uColor2Loc = gl.getUniformLocation(program, 'u_color2');
    const uColor3Loc = gl.getUniformLocation(program, 'u_color3');

    // Attributes
    const posAttr = gl.getAttribLocation(program, 'position');
    const normAttr = gl.getAttribLocation(program, 'normal');
    const uvAttr = gl.getAttribLocation(program, 'uv');

    // Helper to parse hex colors to vec3 (0.0 - 1.0)
    const hexToVec3 = (hex) => {
      const clean = hex.replace('#', '');
      const num = parseInt(clean, 16);
      return [
        ((num >> 16) & 255) / 255,
        ((num >> 8) & 255) / 255,
        (num & 255) / 255
      ];
    };

    const c1 = hexToVec3(color1);
    const c2 = hexToVec3(color2);
    const c3 = hexToVec3(color3);

    // Simple Matrix 4x4 helpers
    const perspective = (fov, aspect, near, far) => {
      const f = 1.0 / Math.tan(fov / 2);
      const nf = 1 / (near - far);
      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0
      ];
    };

    let animationId;
    let startTime = performance.now();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const render = (time) => {
      const elapsed = (time - startTime) * 0.001;

      // Handle canvas resolution
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(program);

      // Set projection & view matrices
      const aspect = canvas.width / canvas.height || 1;
      const proj = perspective((45 * Math.PI) / 180, aspect, 0.1, 100.0);
      
      // Rotate model over time for dynamic 3D spinning
      const rotY = elapsed * 0.6 * speed;
      const rotX = Math.sin(elapsed * 0.4 * speed) * 0.3;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      // ModelView matrix (translate z = -2.5 + rotation)
      const modelView = [
        cosY, sinX * sinY, -cosX * sinY, 0,
        0, cosX, sinX, 0,
        sinY, -sinX * cosY, cosX * cosY, 0,
        0, 0, -2.6, 1
      ];

      gl.uniformMatrix4fv(uProjLoc, false, new Float32Array(proj));
      gl.uniformMatrix4fv(uModelViewLoc, false, new Float32Array(modelView));
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform1f(uSpeedLoc, speed);
      gl.uniform1f(uRoughnessLoc, roughness);
      gl.uniform1f(uAmplitudeLoc, amplitude);
      gl.uniform3fv(uColor1Loc, c1);
      gl.uniform3fv(uColor2Loc, c2);
      gl.uniform3fv(uColor3Loc, c3);

      // Enable attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(posAttr);
      gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
      gl.enableVertexAttribArray(normAttr);
      gl.vertexAttribPointer(normAttr, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.enableVertexAttribArray(uvAttr);
      gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(posBuffer);
      gl.deleteBuffer(normBuffer);
      gl.deleteBuffer(uvBuffer);
      gl.deleteBuffer(idxBuffer);
    };
  }, [color1, color2, color3, speed, roughness, amplitude]);

  const dimensionStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {};

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none pointer-events-none ${className}`}
      style={{
        ...dimensionStyle,
        filter: glow ? `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 20px ${glowColor})` : 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: typeof size === 'number' ? `${size}px` : '100%', height: typeof size === 'number' ? `${size}px` : '100%' }}
      />
    </div>
  );
};

export default AiBlob;
