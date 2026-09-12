import { deflateSync } from "node:zlib";
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, bytes) {
  const label = Buffer.from(type),
    length = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  crc.writeUInt32BE(crc32(Buffer.concat([label, bytes])));
  return Buffer.concat([length, label, bytes, crc]);
}
// Synthetic 8×8 RGB swatches; no real photograph, person, address or property.
export function syntheticPng(color = 0) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(8, 0);
  header.writeUInt32BE(8, 4);
  header[8] = 8;
  header[9] = 2;
  const pixels = Buffer.alloc(8 * (1 + 8 * 3));
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++) {
      const i = row * 25 + 1 + col * 3;
      pixels[i] = (40 + color * 71) % 256;
      pixels[i + 1] = (90 + color * 47) % 256;
      pixels[i + 2] = (160 + color * 23) % 256;
    }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
