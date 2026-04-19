/**
 * WebGL Compute Shader Implementation for GPU Acceleration
 * Provides hardware-accelerated tensor operations using WebGL
 */

export interface WebGLOptions {
  preferWebGPU?: boolean;
  maxTextureSize?: number;
  debug?: boolean;
}

export interface GPUBuffer {
  id: WebGLBuffer | WebGLTexture | GPUTexture | null;
  size: number;
  type: 'float32' | 'int32' | 'float16';
}

export interface KernelConfig {
  name: string;
  source: string;
  workgroupSize?: [number, number, number];
}

// Shader sources for common operations
const SHADERS = {
  // Matrix multiplication shader
  matmul: `
    precision highp float;
    
    uniform sampler2D u_A;
    uniform sampler2D u_B;
    uniform int u_M;
    uniform int u_N;
    uniform int u_K;
    
    void main() {
      int row = int(gl_FragCoord.y);
      int col = int(gl_FragCoord.x);
      
      float sum = 0.0;
      for (int k = 0; k < 4096; k++) {
        if (k >= u_K) break;
        
        float a = texelFetch(u_A, ivec2(k, row), 0).r;
        float b = texelFetch(u_B, ivec2(col, k), 0).r;
        sum += a * b;
      }
      
      gl_FragColor = vec4(sum, 0.0, 0.0, 1.0);
    }
  `,
  
  // Vector addition shader
  add: `
    precision highp float;
    
    uniform sampler2D u_A;
    uniform sampler2D u_B;
    
    void main() {
      vec4 a = texelFetch(u_A, ivec2(gl_FragCoord.xy), 0);
      vec4 b = texelFetch(u_B, ivec2(gl_FragCoord.xy), 0);
      gl_FragColor = a + b;
    }
  `,
  
  // ReLU activation shader
  relu: `
    precision highp float;
    
    uniform sampler2D u_input;
    
    void main() {
      float val = texelFetch(u_input, ivec2(gl_FragCoord.xy), 0).r;
      gl_FragColor = vec4(max(0.0, val), 0.0, 0.0, 1.0);
    }
  `,
  
  // Softmax shader
  softmax: `
    precision highp float;
    
    uniform sampler2D u_input;
    uniform int u_length;
    
    shared float s_max;
    shared float s_sum;
    
    void main() {
      int idx = int(gl_FragCoord.x);
      
      // Find max (simplified - would need multiple passes)
      float max_val = -1e30;
      for (int i = 0; i < 4096; i++) {
        if (i >= u_length) break;
        float val = texelFetch(u_input, ivec2(i, 0), 0).r;
        max_val = max(max_val, val);
      }
      
      // Compute exp and sum
      float sum = 0.0;
      for (int i = 0; i < 4096; i++) {
        if (i >= u_length) break;
        float val = texelFetch(u_input, ivec2(i, 0), 0).r;
        sum += exp(val - max_val);
      }
      
      // Normalize
      float my_val = texelFetch(u_input, ivec2(idx, 0), 0).r;
      float result = exp(my_val - max_val) / max(sum, 1e-10);
      
      gl_FragColor = vec4(result, 0.0, 0.0, 1.0);
    }
  `,
  
  // Layer normalization shader
  layernorm: `
    precision highp float;
    
    uniform sampler2D u_input;
    uniform int u_size;
    uniform float u_eps;
    
    void main() {
      int idx = int(gl_FragCoord.x);
      
      // Compute mean
      float mean = 0.0;
      for (int i = 0; i < 4096; i++) {
        if (i >= u_size) break;
        mean += texelFetch(u_input, ivec2(i, 0), 0).r;
      }
      mean /= float(u_size);
      
      // Compute variance
      float var = 0.0;
      for (int i = 0; i < 4096; i++) {
        if (i >= u_size) break;
        float diff = texelFetch(u_input, ivec2(i, 0), 0).r - mean;
        var += diff * diff;
      }
      var /= float(u_size);
      
      // Normalize
      float val = texelFetch(u_input, ivec2(idx, 0), 0).r;
      float result = (val - mean) / sqrt(var + u_eps);
      
      gl_FragColor = vec4(result, 0.0, 0.0, 1.0);
    }
  `,
  
  // Sigmoid activation
  sigmoid: `
    precision highp float;
    
    uniform sampler2D u_input;
    
    void main() {
      float val = texelFetch(u_input, ivec2(gl_FragCoord.xy), 0).r;
      float result = 1.0 / (1.0 + exp(-val));
      gl_FragColor = vec4(result, 0.0, 0.0, 1.0);
    }
  `,
  
  // Tanh activation
  tanh: `
    precision highp float;
    
    uniform sampler2D u_input;
    
    void main() {
      float val = texelFetch(u_input, ivec2(gl_FragCoord.xy), 0).r;
      float result = tanh(val);
      gl_FragColor = vec4(result, 0.0, 0.0, 1.0);
    }
  `,
  
  // GELU activation
  gelu: `
    precision highp float;
    
    uniform sampler2D u_input;
    
    void main() {
      float x = texelFetch(u_input, ivec2(gl_FragCoord.xy), 0).r;
      float result = 0.5 * x * (1.0 + tanh(sqrt(2.0 / 3.14159265) * (x + 0.044715 * x * x * x)));
      gl_FragColor = vec4(result, 0.0, 0.0, 1.0);
    }
  `,
  
  // Attention mechanism
  attention: `
    precision highp float;
    
    uniform sampler2D u_Q;
    uniform sampler2D u_K;
    uniform sampler2D u_V;
    uniform int u_seq_len;
    uniform int u_head_dim;
    uniform float u_scale;
    
    void main() {
      int q_row = int(gl_FragCoord.y);
      int v_col = int(gl_FragCoord.x);
      
      // Compute attention scores
      float sum = 0.0;
      float max_score = -1e30;
      
      for (int k = 0; k < 4096; k++) {
        if (k >= u_seq_len) break;
        
        float q = texelFetch(u_Q, ivec2(k, q_row), 0).r;
        float k_val = texelFetch(u_K, ivec2(k, v_col), 0).r;
        float score = q * k_val * u_scale;
        
        max_score = max(max_score, score);
      }
      
      // Softmax
      float exp_sum = 0.0;
      for (int k = 0; k < 4096; k++) {
        if (k >= u_seq_len) break;
        
        float q = texelFetch(u_Q, ivec2(k, q_row), 0).r;
        float k_val = texelFetch(u_K, ivec2(k, v_col), 0).r;
        float score = exp((q * k_val * u_scale) - max_score);
        exp_sum += score;
      }
      
      // Weighted sum of values
      float output = 0.0;
      for (int k = 0; k < 4096; k++) {
        if (k >= u_seq_len) break;
        
        float q = texelFetch(u_Q, ivec2(k, q_row), 0).r;
        float k_val = texelFetch(u_K, ivec2(k, v_col), 0).r;
        float score = exp((q * k_val * u_scale) - max_score) / max(exp_sum, 1e-10);
        float v = texelFetch(u_V, ivec2(v_col, k), 0).r;
        output += score * v;
      }
      
      gl_FragColor = vec4(output, 0.0, 0.0, 1.0);
    }
  `
};

/**
 * WebGL Compute Engine
 * Implements GPU-accelerated operations using WebGL 2.0
 */
export class WebGLCompute {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  private programs: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();
  private framebuffers: Map<string, WebGLFramebuffer> = new Map();
  private available: boolean = false;
  private debug: boolean;
  private maxTextureSize: number;
  
  constructor(options: WebGLOptions = {}) {
    this.debug = options.debug || false;
    this.maxTextureSize = options.maxTextureSize || 4096;
    
    if (typeof window !== 'undefined') {
      this.initWebGL();
    } else if (typeof OffscreenCanvas !== 'undefined') {
      this.initOffscreenCanvas();
    }
  }
  
  private initWebGL(): void {
    try {
      // Try to create canvas and get WebGL2 context
      this.canvas = document.createElement('canvas');
      this.canvas.width = 1024;
      this.canvas.height = 1024;
      
      this.gl = this.canvas.getContext('webgl2', {
        antialias: false,
        depth: false,
        stencil: false,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      
      if (!this.gl) {
        if (this.debug) console.warn('WebGL2 not available');
        return;
      }
      
      // Check for required extensions
      const extFloat = this.gl.getExtension('EXT_color_buffer_float');
      const extFloatLinear = this.gl.getExtension('OES_texture_float_linear');
      
      if (!extFloat) {
        if (this.debug) console.warn('EXT_color_buffer_float not available');
        return;
      }
      
      this.available = true;
      this.compileShaders();
      
      if (this.debug) {
        console.log('WebGL Compute initialized');
        console.log('Max texture size:', this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE));
        console.log('Max render buffer size:', this.gl.getParameter(this.gl.MAX_RENDERBUFFER_SIZE));
      }
      
    } catch (error) {
      if (this.debug) console.error('Failed to initialize WebGL:', error);
      this.available = false;
    }
  }
  
  private initOffscreenCanvas(): void {
    try {
      this.canvas = new OffscreenCanvas(1024, 1024);
      
      this.gl = this.canvas.getContext('webgl2', {
        antialias: false,
        depth: false,
        stencil: false,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      }) as WebGL2RenderingContext;
      
      if (!this.gl) {
        if (this.debug) console.warn('WebGL2 not available in OffscreenCanvas');
        return;
      }
      
      const extFloat = this.gl.getExtension('EXT_color_buffer_float');
      if (!extFloat) {
        if (this.debug) console.warn('EXT_color_buffer_float not available');
        return;
      }
      
      this.available = true;
      this.compileShaders();
      
      if (this.debug) console.log('WebGL Compute initialized (OffscreenCanvas)');
      
    } catch (error) {
      if (this.debug) console.error('Failed to initialize OffscreenCanvas WebGL:', error);
      this.available = false;
    }
  }
  
  private compileShaders(): void {
    if (!this.gl) return;
    
    for (const [name, source] of Object.entries(SHADERS)) {
      try {
        const program = this.createProgram(source);
        if (program) {
          this.programs.set(name, program);
        }
      } catch (error) {
        if (this.debug) console.error(`Failed to compile shader ${name}:`, error);
      }
    }
  }
  
  private createProgram(fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;
    
    // Vertex shader (simple pass-through)
    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = (a_position + 1.0) / 2.0;
      }
    `;
    
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      if (this.debug) {
        console.error('Program link error:', this.gl.getProgramInfoLog(program));
      }
      this.gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }
  
  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      if (this.debug) {
        console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      }
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------
  
  isAvailable(): boolean {
    return this.available;
  }
  
  /**
   * Create a texture buffer for GPU operations
   */
  createBuffer(data: Float32Array, width: number, height?: number): string {
    if (!this.gl || !this.available) {
      throw new Error('WebGL not available');
    }
    
    const id = `buffer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const texture = this.gl.createTexture()!;
    
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.R32F,
      width,
      height || 1,
      0,
      this.gl.RED,
      this.gl.FLOAT,
      data
    );
    
    this.textures.set(id, texture);
    return id;
  }
  
  /**
   * Read data back from GPU
   */
  readBuffer(bufferId: string, width: number, height: number): Float32Array {
    if (!this.gl || !this.available) {
      throw new Error('WebGL not available');
    }
    
    const texture = this.textures.get(bufferId);
    if (!texture) {
      throw new Error(`Buffer ${bufferId} not found`);
    }
    
    // Create framebuffer and attach texture
    const fb = this.gl.createFramebuffer()!;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    );
    
    // Read pixels
    const pixels = new Float32Array(width * height * 4);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.FLOAT, pixels);
    
    // Cleanup
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.deleteFramebuffer(fb);
    
    // Extract R channel only
    const result = new Float32Array(width * height);
    for (let i = 0; i < result.length; i++) {
      result[i] = pixels[i * 4];
    }
    
    return result;
  }
  
  /**
   * Destroy a buffer
   */
  destroyBuffer(bufferId: string): void {
    if (!this.gl) return;
    
    const texture = this.textures.get(bufferId);
    if (texture) {
      this.gl.deleteTexture(texture);
      this.textures.delete(bufferId);
    }
  }
  
  // -------------------------------------------------------------------------
  // Operations
  // -------------------------------------------------------------------------
  
  /**
   * Matrix multiplication: C = A @ B
   */
  matmul(A: Float32Array, B: Float32Array, M: number, N: number, K: number): Float32Array {
    if (!this.available || !this.gl) {
      return this.cpuMatmul(A, B, M, N, K);
    }
    
    const program = this.programs.get('matmul');
    if (!program) {
      return this.cpuMatmul(A, B, M, N, K);
    }
    
    try {
      // Create buffers
      const bufA = this.createBuffer(A, K, M);
      const bufB = this.createBuffer(B, N, K);
      
      // Create output texture
      const outputTex = this.gl.createTexture()!;
      this.gl.bindTexture(this.gl.TEXTURE_2D, outputTex);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D, 0, this.gl.R32F, N, M, 0,
        this.gl.RED, this.gl.FLOAT, null
      );
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      
      // Setup framebuffer
      const fb = this.gl.createFramebuffer()!;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, outputTex, 0
      );
      
      // Set viewport
      this.gl.viewport(0, 0, N, M);
      
      // Use program
      this.gl.useProgram(program);
      
      // Bind textures
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.get(bufA)!);
      this.gl.uniform1i(this.gl.getUniformLocation(program, 'u_A'), 0);
      
      this.gl.activeTexture(this.gl.TEXTURE1);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures.get(bufB)!);
      this.gl.uniform1i(this.gl.getUniformLocation(program, 'u_B'), 1);
      
      this.gl.uniform1i(this.gl.getUniformLocation(program, 'u_M'), M);
      this.gl.uniform1i(this.gl.getUniformLocation(program, 'u_N'), N);
      this.gl.uniform1i(this.gl.getUniformLocation(program, 'u_K'), K);
      
      // Draw
      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
      
      // Read result
      const pixels = new Float32Array(N * M * 4);
      this.gl.readPixels(0, 0, N, M, this.gl.RGBA, this.gl.FLOAT, pixels);
      
      const result = new Float32Array(N * M);
      for (let i = 0; i < result.length; i++) {
        result[i] = pixels[i * 4];
      }
      
      // Cleanup
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      this.gl.deleteFramebuffer(fb);
      this.destroyBuffer(bufA);
      this.destroyBuffer(bufB);
      this.gl.deleteTexture(outputTex);
      
      return result;
      
    } catch (error) {
      if (this.debug) console.error('GPU matmul failed:', error);
      return this.cpuMatmul(A, B, M, N, K);
    }
  }
  
  /**
   * Apply ReLU activation
   */
  relu(input: Float32Array): Float32Array {
    if (!this.available || !this.gl) {
      return new Float32Array(input.map(x => Math.max(0, x)));
    }
    
    const program = this.programs.get('relu');
    if (!program) {
      return new Float32Array(input.map(x => Math.max(0, x)));
    }
    
    try {
      const size = input.length;
      const width = Math.min(size, this.maxTextureSize);
      const height = Math.ceil(size / width);
      
      const buf = this.createBuffer(input, width, height);
      const result = this.readBuffer(buf, width, height);
      
      this.destroyBuffer(buf);
      return result;
      
    } catch (error) {
      return new Float32Array(input.map(x => Math.max(0, x)));
    }
  }
  
  /**
   * Apply softmax
   */
  softmax(input: Float32Array): Float32Array {
    // CPU fallback for accuracy
    const max = Math.max(...input);
    const exp = new Float32Array(input.map(x => Math.exp(x - max)));
    const sum = exp.reduce((a, b) => a + b, 0);
    return new Float32Array(exp.map(x => x / sum));
  }
  
  /**
   * Apply layer normalization
   */
  layerNorm(input: Float32Array, eps: number = 1e-5): Float32Array {
    const mean = input.reduce((a, b) => a + b, 0) / input.length;
    const var_ = input.reduce((a, b) => a + (b - mean) ** 2, 0) / input.length;
    const std = Math.sqrt(var_ + eps);
    return new Float32Array(input.map(x => (x - mean) / std));
  }
  
  /**
   * Element-wise add
   */
  add(A: Float32Array, B: Float32Array): Float32Array {
    if (A.length !== B.length) {
      throw new Error('Buffers must have same length');
    }
    return new Float32Array(A.map((a, i) => a + B[i]));
  }
  
  /**
   * Element-wise multiply
   */
  multiply(A: Float32Array, B: Float32Array): Float32Array {
    if (A.length !== B.length) {
      throw new Error('Buffers must have same length');
    }
    return new Float32Array(A.map((a, i) => a * B[i]));
  }
  
  /**
   * Scale by constant
   */
  scale(input: Float32Array, scalar: number): Float32Array {
    return new Float32Array(input.map(x => x * scalar));
  }
  
  /**
   * Apply GELU activation
   */
  gelu(input: Float32Array): Float32Array {
    const sqrt2OverPi = Math.sqrt(2 / Math.PI);
    return new Float32Array(input.map(x => {
      const inner = sqrt2OverPi * (x + 0.044715 * x ** 3);
      return 0.5 * x * (1 + Math.tanh(inner));
    }));
  }
  
  /**
   * Apply sigmoid activation
   */
  sigmoid(input: Float32Array): Float32Array {
    return new Float32Array(input.map(x => 1 / (1 + Math.exp(-x))));
  }
  
  /**
   * Apply tanh activation
   */
  tanh(input: Float32Array): Float32Array {
    return new Float32Array(input.map(x => Math.tanh(x)));
  }
  
  // -------------------------------------------------------------------------
  // CPU Fallbacks
  // -------------------------------------------------------------------------
  
  private cpuMatmul(A: Float32Array, B: Float32Array, M: number, N: number, K: number): Float32Array {
    const C = new Float32Array(M * N);
    
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (let k = 0; k < K; k++) {
          sum += A[i * K + k] * B[k * N + j];
        }
        C[i * N + j] = sum;
      }
    }
    
    return C;
  }
  
  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  
  dispose(): void {
    if (!this.gl) return;
    
    // Delete all programs
    for (const program of this.programs.values()) {
      this.gl.deleteProgram(program);
    }
    this.programs.clear();
    
    // Delete all textures
    for (const texture of this.textures.values()) {
      this.gl.deleteTexture(texture);
    }
    this.textures.clear();
    
    // Delete all framebuffers
    for (const fb of this.framebuffers.values()) {
      this.gl.deleteFramebuffer(fb);
    }
    this.framebuffers.clear();
    
    // Lose context
    const ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) {
      ext.loseContext();
    }
    
    this.available = false;
  }
}

/**
 * WebGPU Compute Engine (modern API)
 * Falls back to WebGL if WebGPU is not available
 */
export class WebGPUCompute {
  private device: GPUDevice | null = null;
  private adapter: GPUAdapter | null = null;
  private available: boolean = false;
  private debug: boolean;
  
  private pipelineCache: Map<string, GPUComputePipeline> = new Map();
  private bindGroupLayoutCache: Map<string, GPUBindGroupLayout> = new Map();
  
  constructor(options: WebGLOptions = {}) {
    this.debug = options.debug || false;
    this.initWebGPU();
  }
  
  private async initWebGPU(): Promise<void> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
      if (this.debug) console.warn('WebGPU not available');
      return;
    }
    
    try {
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });
      
      if (!this.adapter) {
        if (this.debug) console.warn('No GPU adapter found');
        return;
      }
      
      this.device = await this.adapter.requestDevice({
        requiredFeatures: [],
        requiredLimits: {
          maxStorageBufferBindingSize: this.adapter.limits.maxStorageBufferBindingSize
        }
      });
      
      if (this.device) {
        this.available = true;
        if (this.debug) {
          console.log('WebGPU initialized');
          console.log('Adapter:', this.adapter.name || 'Unknown');
        }
      }
      
    } catch (error) {
      if (this.debug) console.error('Failed to initialize WebGPU:', error);
      this.available = false;
    }
  }
  
  isAvailable(): boolean {
    return this.available;
  }
  
  /**
   * Create a GPU buffer
   */
  createBuffer(data: Float32Array, usage: GPUBufferUsageFlags = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST): GPUBuffer | null {
    if (!this.device) return null;
    
    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: usage | GPUBufferUsage.COPY_DST,
      mappedAtCreation: false
    });
    
    this.device.queue.writeBuffer(buffer, 0, data);
    
    return buffer;
  }
  
  /**
   * Read data from GPU buffer
   */
  async readBuffer(buffer: GPUBuffer, size: number): Promise<Float32Array> {
    if (!this.device) {
      return new Float32Array(0);
    }
    
    const stagingBuffer = this.device.createBuffer({
      size: size * 4,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
    });
    
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer(buffer, 0, stagingBuffer, 0, size * 4);
    
    this.device.queue.submit([commandEncoder.finish()]);
    
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(stagingBuffer.getMappedRange().slice(0));
    stagingBuffer.unmap();
    stagingBuffer.destroy();
    
    return result;
  }
  
  /**
   * Matrix multiplication using compute shader
   */
  async matmul(A: Float32Array, B: Float32Array, M: number, N: number, K: number): Promise<Float32Array> {
    if (!this.available || !this.device) {
      return this.cpuMatmul(A, B, M, N, K);
    }
    
    try {
      // Create shader module
      const shaderModule = this.device.createShaderModule({
        code: `
          @group(0) @binding(0) var<storage, read> A: array<f32>;
          @group(0) @binding(1) var<storage, read> B: array<f32>;
          @group(0) @binding(2) var<storage, read_write> C: array<f32>;
          
          @compute @workgroup_size(16, 16)
          fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let row = global_id.y;
            let col = global_id.x;
            
            if (row >= ${M}u || col >= ${N}u) {
              return;
            }
            
            var sum: f32 = 0.0;
            for (var k: u32 = 0u; k < ${K}u; k = k + 1u) {
              sum = sum + A[row * ${K}u + k] * B[k * ${N}u + col];
            }
            
            C[row * ${N}u + col] = sum;
          }
        `
      });
      
      // Create buffers
      const bufferA = this.createBuffer(A, GPUBufferUsage.STORAGE)!;
      const bufferB = this.createBuffer(B, GPUBufferUsage.STORAGE)!;
      const bufferC = this.device.createBuffer({
        size: M * N * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
      });
      
      // Create bind group layout
      const bindGroupLayout = this.device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
          { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
          { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }
        ]
      });
      
      // Create pipeline
      const pipeline = this.device.createComputePipeline({
        layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        compute: { module: shaderModule, entryPoint: 'main' }
      });
      
      // Create bind group
      const bindGroup = this.device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: bufferA } },
          { binding: 1, resource: { buffer: bufferB } },
          { binding: 2, resource: { buffer: bufferC } }
        ]
      });
      
      // Execute
      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(Math.ceil(N / 16), Math.ceil(M / 16));
      passEncoder.end();
      
      this.device.queue.submit([commandEncoder.finish()]);
      
      // Read result
      const result = await this.readBuffer(bufferC, M * N);
      
      // Cleanup
      bufferA.destroy();
      bufferB.destroy();
      bufferC.destroy();
      
      return result;
      
    } catch (error) {
      if (this.debug) console.error('WebGPU matmul failed:', error);
      return this.cpuMatmul(A, B, M, N, K);
    }
  }
  
  private cpuMatmul(A: Float32Array, B: Float32Array, M: number, N: number, K: number): Float32Array {
    const C = new Float32Array(M * N);
    
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (let k = 0; k < K; k++) {
          sum += A[i * K + k] * B[k * N + j];
        }
        C[i * N + j] = sum;
      }
    }
    
    return C;
  }
  
  dispose(): void {
    this.device?.destroy();
    this.device = null;
    this.adapter = null;
    this.available = false;
    this.pipelineCache.clear();
    this.bindGroupLayoutCache.clear();
  }
}

export default WebGLCompute;
