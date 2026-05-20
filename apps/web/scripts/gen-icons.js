/**
 * Generates solid-colour PNG placeholder icons for the PWA manifest.
 * Uses only Node.js built-ins (zlib, fs, path) — no extra dependencies.
 * Run: node scripts/gen-icons.js
 */
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// Build CRC-32 lookup table (PNG requires CRC for every chunk)
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crcBuf]);
}

function createPNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  // compression / filter / interlace all 0

  // Raw scanlines: filter-byte(0) + RGB * width, one per row
  const rowLen = 1 + width * 3;
  const raw = Buffer.alloc(height * rowLen);
  for (let y = 0; y < height; y++) {
    const base = y * rowLen;
    raw[base] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      raw[base + 1 + x * 3] = r;
      raw[base + 2 + x * 3] = g;
      raw[base + 3 + x * 3] = b;
    }
  }

  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.resolve(__dirname, "../public/icons");
fs.mkdirSync(outDir, { recursive: true });

// Brand plum #3d1a4a
const R = 0x3d, G = 0x1a, B = 0x4a;

const icons = [
  { name: "icon-72x72.png",   w: 72,   h: 72   },
  { name: "icon-96x96.png",   w: 96,   h: 96   },
  { name: "icon-128x128.png", w: 128,  h: 128  },
  { name: "icon-192x192.png", w: 192,  h: 192  },
  { name: "icon-384x384.png", w: 384,  h: 384  },
  { name: "icon-512x512.png", w: 512,  h: 512  },
  { name: "apple-touch-icon.png", w: 180, h: 180 },
  { name: "og-image.png",     w: 1200, h: 630  },
];

for (const { name, w, h } of icons) {
  const buf = createPNG(w, h, R, G, B);
  fs.writeFileSync(path.join(outDir, name), buf);
  console.log(`✓  ${name}  (${w}×${h}, ${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log("\nAll icons written to public/icons/");
