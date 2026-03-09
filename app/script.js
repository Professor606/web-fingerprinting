function sha256(obj) {
  const str = JSON.stringify(obj);

  function utf8Encode(str) {
    return unescape(encodeURIComponent(str));
  }

  function rotr(n, x) {
    return (x >>> n) | (x << (32 - n));
  }

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const msg = utf8Encode(str);
  const msgLen = msg.length;
  const bitLen = msgLen * 8;

  const paddedLen = Math.ceil((msgLen + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);

  for (let i = 0; i < msgLen; i++) {
    padded[i] = msg.charCodeAt(i);
  }

  padded[msgLen] = 0x80;

  for (let i = 0; i < 8; i++) {
    padded[paddedLen - 1 - i] = (bitLen >>> (i * 8)) & 0xff;
  }

  for (let offset = 0; offset < paddedLen; offset += 64) {
    const W = new Array(64);

    for (let i = 0; i < 16; i++) {
      W[i] = (padded[offset + i * 4] << 24) |
        (padded[offset + i * 4 + 1] << 16) |
        (padded[offset + i * 4 + 2] << 8) |
        (padded[offset + i * 4 + 3]);
    }

    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3);
      const s1 = rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map(h => ('00000000' + (h >>> 0).toString(16)).slice(-8)).join('');
}

// ─── Advanced Fingerprinting Techniques ───────────────────────────────────────

/**
 * Canvas Fingerprinting
 * Renders text and shapes on a hidden canvas. Different GPUs, OS, and font
 * renderers produce subtly different pixel output, making this highly unique.
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { canvasHash: 'unsupported' };

    // Draw a complex scene that varies across renderers
    ctx.fillStyle = '#f60';
    ctx.fillRect(100, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('Fingerprint 🖐️', 2, 15);

    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '18px Times New Roman, serif';
    ctx.fillText('Canvas Test!', 4, 45);

    // Draw arcs and gradients — these vary with anti-aliasing implementations
    ctx.beginPath();
    ctx.arc(200, 30, 20, 0, Math.PI * 2);
    const gradient = ctx.createLinearGradient(180, 10, 220, 50);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Blend mode test
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgb(255, 0, 255)';
    ctx.fillRect(130, 10, 50, 40);

    const dataUrl = canvas.toDataURL('image/png');
    return { canvasDataUrl: dataUrl };
  } catch (e) {
    return { canvasHash: 'error' };
  }
}

/**
 * WebGL Fingerprinting
 * Extracts GPU vendor, renderer, supported extensions, and rendering parameters.
 * The combination is highly unique per hardware + driver combination.
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { webgl: 'unsupported' };

    const result = {};

    // GPU info via debug extension
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    // Rendering parameters
    result.version = gl.getParameter(gl.VERSION);
    result.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    result.maxCubeMapTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    result.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    result.maxViewportDims = Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
    result.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    result.maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    result.maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    result.maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);
    result.aliasedLineWidthRange = Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));
    result.aliasedPointSizeRange = Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE));
    result.maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    result.maxCombinedTextureImageUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

    // Supported extensions
    result.extensions = gl.getSupportedExtensions() || [];

    // Precision formats
    const precisions = {};
    for (const shaderType of [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER]) {
      const label = shaderType === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
      precisions[label] = {};
      for (const precisionType of [gl.LOW_FLOAT, gl.MEDIUM_FLOAT, gl.HIGH_FLOAT, gl.LOW_INT, gl.MEDIUM_INT, gl.HIGH_INT]) {
        const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
        if (format) {
          precisions[label][precisionType] = {
            rangeMin: format.rangeMin,
            rangeMax: format.rangeMax,
            precision: format.precision
          };
        }
      }
    }
    result.precisions = precisions;

    return result;
  } catch (e) {
    return { webgl: 'error' };
  }
}

/**
 * AudioContext Fingerprinting
 * Runs an oscillator through a compressor in an offline audio context.
 * The rendered audio samples vary subtly across audio stacks and hardware.
 */
function getAudioFingerprint() {
  return new Promise((resolve) => {
    try {
      const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!OfflineCtx) {
        resolve({ audio: 'unsupported' });
        return;
      }

      const context = new OfflineCtx(1, 44100, 44100); // 1 second of audio

      // Create oscillator
      const oscillator = context.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      // Create compressor to add processing variance
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, context.currentTime);
      compressor.knee.setValueAtTime(40, context.currentTime);
      compressor.ratio.setValueAtTime(12, context.currentTime);
      compressor.attack.setValueAtTime(0, context.currentTime);
      compressor.release.setValueAtTime(0.25, context.currentTime);

      oscillator.connect(compressor);
      compressor.connect(context.destination);

      oscillator.start(0);

      context.startRendering().then((buffer) => {
        const data = buffer.getChannelData(0);
        // Sample a subset of the audio data for fingerprinting
        const samples = [];
        for (let i = 4500; i < 5000; i++) {
          samples.push(data[i]);
        }
        // Sum for a quick numeric fingerprint
        const sum = samples.reduce((acc, val) => acc + Math.abs(val), 0);
        resolve({
          audioSampleSum: sum,
          audioSampleCount: samples.length,
          audioSample: samples.slice(0, 10).map(s => s.toFixed(10))
        });
      }).catch(() => {
        resolve({ audio: 'error' });
      });

      // Timeout fallback
      setTimeout(() => resolve({ audio: 'timeout' }), 3000);
    } catch (e) {
      resolve({ audio: 'error' });
    }
  });
}

/**
 * Font Enumeration Fingerprinting
 * Measures rendered text width for a list of fonts against baseline fallbacks.
 * If the width differs from the fallback, the font is installed.
 * The set of installed fonts is highly unique.
 */
function getFontsFingerprint() {
  try {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli1|';
    const testSize = '72px';

    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.style.top = '-9999px';
    span.style.fontSize = testSize;
    span.style.lineHeight = 'normal';
    span.textContent = testString;
    document.body.appendChild(span);

    // Measure baseline widths
    const baselineWidths = {};
    for (const base of baseFonts) {
      span.style.fontFamily = base;
      baselineWidths[base] = span.offsetWidth;
    }

    const fontsToTest = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria',
      'Century Gothic', 'Comic Sans MS', 'Consolas', 'Courier', 'Courier New',
      'Georgia', 'Geneva', 'Helvetica', 'Helvetica Neue', 'Impact',
      'Lucida Console', 'Lucida Grande', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'Monaco', 'Monospace', 'Palatino', 'Palatino Linotype',
      'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS',
      'Verdana', 'Wingdings',
      // Less common fonts — more discriminating
      'Abadi MT', 'Agency FB', 'Antiqua', 'Avenir', 'Baskerville',
      'Big Caslon', 'Bodoni MT', 'Book Antiqua', 'Bookman Old Style',
      'Candara', 'Century Schoolbook', 'Copperplate', 'Didot',
      'Franklin Gothic Medium', 'Futura', 'Garamond', 'Gill Sans',
      'Goudy Old Style', 'Haettenschweiler', 'Harlow Solid Italic',
      'Hoefler Text', 'Jokerman', 'Lato', 'Lucida Bright',
      'MS Gothic', 'MS PGothic', 'MS Reference Sans Serif',
      'Noto Sans', 'hack', 'Open Sans', 'Optima', 'Roboto', 'Rockwell',
      'San Francisco', 'Ubuntu'
    ];

    const detectedFonts = [];
    for (const font of fontsToTest) {
      let detected = false;
      for (const base of baseFonts) {
        span.style.fontFamily = `'${font}', ${base}`;
        if (span.offsetWidth !== baselineWidths[base]) {
          detected = true;
          break;
        }
      }
      if (detected) detectedFonts.push(font);
    }

    document.body.removeChild(span);

    return {
      detectedFonts,
      fontCount: detectedFonts.length
    };
  } catch (e) {
    return { fonts: 'error' };
  }
}

/**
 * WebRTC Local IP Leak
 * Uses RTCPeerConnection with a STUN server to discover the user's
 * local/private IP address (e.g. 192.168.x.x) — works even behind VPNs.
 */
function getWebRTCFingerprint() {
  return new Promise((resolve) => {
    try {
      const RTCPeer = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
      if (!RTCPeer) {
        resolve({ webrtc: 'unsupported' });
        return;
      }

      const pc = new RTCPeer({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      const ips = new Set();
      let resolved = false;

      pc.createDataChannel('');

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) {
          // Gathering complete
          if (!resolved) {
            resolved = true;
            pc.close();
            resolve({
              localIPs: Array.from(ips),
              ipCount: ips.size
            });
          }
          return;
        }

        const candidate = event.candidate.candidate;
        // Extract IP addresses from the candidate string
        const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
        const ipv6Regex = /([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/gi;

        const matches = candidate.match(ipRegex);
        if (matches) {
          matches.forEach(ip => ips.add(ip));
        }
        const v6matches = candidate.match(ipv6Regex);
        if (v6matches) {
          v6matches.forEach(ip => ips.add(ip));
        }
      };

      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => {
          if (!resolved) {
            resolved = true;
            resolve({ webrtc: 'error' });
          }
        });

      // Timeout after 2 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          pc.close();
          resolve({
            localIPs: Array.from(ips),
            ipCount: ips.size
          });
        }
      }, 2000);
    } catch (e) {
      resolve({ webrtc: 'error' });
    }
  });
}

// ─── Main Collection Function ─────────────────────────────────────────────────

async function getClientInfoAndHashes() {
  const info = {};

  // Browser fingerprint data
  info.userAgent = navigator.userAgent;
  info.platform = navigator.platform;
  info.doNotTrack = navigator.doNotTrack;
  info.javaEnabled = navigator.javaEnabled?.() || false;

  // Device fingerprint data
  info.hardwareConcurrency = navigator.hardwareConcurrency || 'unknown';
  info.deviceMemory = navigator.deviceMemory || 'unknown';
  info.screen = {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth
  };

  // Languages fingerprint data
  info.language = navigator.language;
  info.languages = navigator.languages;

  // Window fingerprint data
  info.window = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    devicePixelRatio: window.devicePixelRatio
  };

  // Timezone fingerprint data
  info.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  info.localTime = new Date().toTimeString();

  // IP fingerprint data
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('/api/ipinfo', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    info.ip = data.ip;
    info.ipLocation = {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country || 'Unknown',
      loc: data.loc || null,
      org: data.org || 'Unknown',
      postal: data.postal || 'Unknown',
      timezone: data.timezone || 'Unknown'
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("IP fetch timed out");
    } else {
      console.error("IP fetch failed:", error);
    }

    info.ip = "Unavailable";
    info.ipLocation = {
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      loc: null,
      org: 'Unknown',
      postal: 'Unknown',
      timezone: 'Unknown'
    };
  }

  // ─── Advanced fingerprints (run in parallel) ────────────────────────────────
  const [canvasResult, audioResult, webrtcResult] = await Promise.allSettled([
    Promise.resolve(getCanvasFingerprint()),
    getAudioFingerprint(),
    getWebRTCFingerprint()
  ]);

  // Synchronous techniques
  const webglData = getWebGLFingerprint();
  const fontsData = getFontsFingerprint();

  info.canvas = canvasResult.status === 'fulfilled' ? canvasResult.value : { canvasHash: 'error' };
  info.webgl = webglData;
  info.audio = audioResult.status === 'fulfilled' ? audioResult.value : { audio: 'error' };
  info.fonts = fontsData;
  info.webrtc = webrtcResult.status === 'fulfilled' ? webrtcResult.value : { webrtc: 'error' };

  // ─── Hash Groups ────────────────────────────────────────────────────────────

  // Group 6: IP fingerprint
  const ipGroup = {
    ip: info.ip,
    ipLocation: info.ipLocation
  };


  // Hash all groups
  const hash1 = sha256(info.userAgent);
  const hash2 = sha256(info.platform);
  const hash3 = sha256(info.doNotTrack);
  const hash4 = sha256(info.javaEnabled);

  const hash5 = sha256(info.hardwareConcurrency);
  const hash6 = sha256(info.deviceMemory);
  const hash7 = sha256(info.screen);

  const hash8 = sha256(info.language);
  const hash9 = sha256(info.languages);

  const hash10 = sha256(info.window);

  const hash11 = sha256(info.timezone);

  const hash12 = info.ip === "Unavailable" ? "" : sha256(ipGroup);

  const hash13 = sha256(info.canvas);
  const hash14 = sha256(info.webgl);
  const hash15 = sha256(info.audio);
  const hash16 = sha256(info.fonts);
  const hash17 = sha256(info.webrtc);

  return {
    info,
    hashes: {
      userAgentFingerprint: hash1,
      platformFingerprint: hash2,
      doNotTrackFingerprint: hash3,
      javaEnabledFingerprint: hash4,
      hardwareConcurrencyFingerprint: hash5,
      deviceMemoryFingerprint: hash6,
      screenFingerprint: hash7,
      languageFingerprint: hash8,
      languagesFingerprint: hash9,
      windowFingerprint: hash10,
      timezoneFingerprint: hash11,
      ipFingerprint: hash12,
      canvasFingerprint: hash13,
      webglFingerprint: hash14,
      audioFingerprint: hash15,
      fontsFingerprint: hash16,
      webrtcFingerprint: hash17,
    }
  };
}

const sendData = async (hashes, info) => {
  const payload = {
    timestamp: new Date().toISOString(),
    fingerprints: hashes,
    info: info
  };

  try {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

  } catch (error) {
    console.error('Network error:', error);
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  const result = await getClientInfoAndHashes();
  sendData(result.hashes, result.info);

  const display = document.getElementById('display');
  if (display) display.textContent = JSON.stringify(result, null, 2);
});