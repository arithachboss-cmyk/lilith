// Validate a bounded PNG subset using CRCs and actual zlib scanlines.
export async function validImage(
  bytes: Uint8Array,
  mime: string,
): Promise<boolean> {
  if (
    mime !== "image/png" ||
    bytes.length < 57 ||
    bytes.slice(0, 8).join() !== "137,80,78,71,13,10,26,10"
  )
    return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8,
    width = 0,
    height = 0,
    channels = 0,
    complete = false;
  const idat: Uint8Array[] = [];
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset),
      end = offset + 12 + length;
    if (end > bytes.length) return false;
    const name = new TextDecoder().decode(bytes.slice(offset + 4, offset + 8));
    let crc = 0xffffffff;
    for (const b of bytes.slice(offset + 4, offset + 8 + length)) {
      crc ^= b;
      for (let k = 0; k < 8; k++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    if ((crc ^ 0xffffffff) >>> 0 !== view.getUint32(offset + 8 + length))
      return false;
    if (offset === 8) {
      if (name !== "IHDR" || length !== 13) return false;
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      channels =
        ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[
          bytes[offset + 17]
        ] ?? 0;
      if (
        width < 1 ||
        height < 1 ||
        width > 4096 ||
        height > 4096 ||
        !channels ||
        bytes[offset + 16] !== 8 ||
        bytes[offset + 18] !== 0 ||
        bytes[offset + 19] !== 0 ||
        bytes[offset + 20] !== 0
      )
        return false;
    } else if (name === "IHDR") return false;
    if (name === "IDAT")
      idat.push(bytes.slice(offset + 8, offset + 8 + length));
    if (name === "IEND") {
      complete = length === 0 && end === bytes.length;
      break;
    }
    offset = end;
  }
  const stride = width * channels + 1,
    expected = stride * height;
  if (!complete || !idat.length || expected > 8 * 1024 * 1024) return false;
  const compressed = new Uint8Array(
    idat.reduce((sum, part) => sum + part.length, 0),
  );
  offset = 0;
  for (const part of idat) {
    compressed.set(part, offset);
    offset += part.length;
  }
  const reader = new Blob([compressed])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"))
    .getReader();
  let count = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (count + value.length > expected) {
        await reader.cancel();
        return false;
      }
      for (let i = 0; i < value.length; i++)
        if ((count + i) % stride === 0 && value[i] > 4) {
          await reader.cancel();
          return false;
        }
      count += value.length;
    }
    return count === expected;
  } catch {
    return false;
  } finally {
    reader.releaseLock();
  }
}
