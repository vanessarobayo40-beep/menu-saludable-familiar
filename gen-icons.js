// Genera iconos PNG (192 y 512) para la PWA, sin dependencias externas.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePNG(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // raw scanlines con filtro 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      raw[p++] = pixels[i]; raw[p++] = pixels[i + 1];
      raw[p++] = pixels[i + 2]; raw[p++] = pixels[i + 3];
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function draw(size) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const af = a / 255;
    px[i] = Math.round(r * af + px[i] * (1 - af));
    px[i + 1] = Math.round(g * af + px[i + 1] * (1 - af));
    px[i + 2] = Math.round(b * af + px[i + 2] * (1 - af));
    px[i + 3] = Math.max(px[i + 3], a);
  };
  const disc = (cx, cy, rad, r, g, b) => {
    for (let y = Math.floor(cy - rad - 1); y <= cy + rad + 1; y++)
      for (let x = Math.floor(cx - rad - 1); x <= cx + rad + 1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= rad - 1) set(x, y, r, g, b, 255);
        else if (d <= rad) set(x, y, r, g, b, Math.round(255 * (rad - d))); // antialias borde
      }
  };
  // Fondo verde full-bleed (apto para maskable)
  for (let i = 0; i < size * size; i++) { px[i*4]=26; px[i*4+1]=122; px[i*4+2]=69; px[i*4+3]=255; }
  const c = size / 2;
  // Plato blanco
  disc(c, c, size * 0.34, 255, 255, 255);
  disc(c, c, size * 0.30, 245, 250, 245);
  // Vegetales (ensalada)
  const u = size;
  disc(c - u*0.10, c - u*0.06, u*0.085, 76, 175, 80);   // lechuga verde
  disc(c + u*0.09, c - u*0.04, u*0.075, 102, 187, 106);  // verde claro
  disc(c + u*0.02, c + u*0.10, u*0.070, 229, 57, 53);    // tomate rojo
  disc(c - u*0.06, c + u*0.09, u*0.060, 255, 152, 0);    // zanahoria
  disc(c + u*0.11, c + u*0.08, u*0.050, 255, 202, 40);   // maíz amarillo
  disc(c - u*0.01, c - u*0.10, u*0.055, 139, 195, 74);   // pepino
  return px;
}

const outDir = path.join(__dirname, 'public');
for (const size of [192, 512]) {
  const png = encodePNG(size, draw(size));
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`icon-${size}.png ${png.length} bytes`);
}
