// Dev-only: generates the PNG icons with no dependencies. Run: node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const BG = [22, 18, 15];
const GOLD = [219, 168, 67];
const DARK = [29, 21, 8];
const B = ['1111.', '1...1', '1...1', '1111.', '1...1', '1...1', '1111.'];

// Pointy-top hexagon (d20 silhouette) test in unit coordinates centred on 0.
const inHex = (x, y, r) => {
  const ax = Math.abs(x), ay = Math.abs(y);
  return ay <= r && ax * Math.sqrt(3) / 2 + ay / 2 <= r * Math.sqrt(3) / 2 + 0.0001 * 0 && ax <= r * Math.sqrt(3) / 2;
};

function render(size, hexR = 0.4, cell = 0.07) {
  const SS = 3;
  return png(size, (px, py) => {
    let rs = 0, gs = 0, bs = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const x = (px + (sx + 0.5) / SS) / size - 0.5;
      const y = (py + (sy + 0.5) / SS) / size - 0.5;
      let c = BG;
      if (inHex(x, y, hexR)) {
        c = GOLD;
        // letter B, 5x7 grid centred, cell = 0.07
        const gx = Math.floor((x + 2.5 * cell) / cell), gy = Math.floor((y + 3.5 * cell) / cell);
        if (gx >= 0 && gx < 5 && gy >= 0 && gy < 7 && B[gy][gx] === '1') c = DARK;
      }
      rs += c[0]; gs += c[1]; bs += c[2];
    }
    const n = SS * SS;
    return [Math.round(rs / n), Math.round(gs / n), Math.round(bs / n)];
  });
}

mkdirSync('icons', { recursive: true });
for (const s of [180, 192, 512]) writeFileSync(`icons/icon-${s}.png`, render(s));
// Android adaptive icon: everything must sit inside the central 80% circle, so draw smaller.
writeFileSync('icons/icon-maskable-512.png', render(512, 0.28, 0.049));
console.log('icons written');
