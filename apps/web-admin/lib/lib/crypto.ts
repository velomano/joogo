// Edge-safe crypto helpers (Web Crypto)
const te = new TextEncoder();
const toUint8 = (d: string | Uint8Array): Uint8Array => (typeof d === 'string' ? te.encode(d) : d);
const bufToHex = (buf: ArrayBuffer): string => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(data: string | Uint8Array) {
  const dataBuffer = toUint8(data);
  const digest = await crypto.subtle.digest('SHA-256', dataBuffer.buffer as ArrayBuffer);
  return bufToHex(digest);
}

export async function hmacSha256Hex(key: string | Uint8Array, msg: string | Uint8Array) {
  const keyData = toUint8(key);
  const msgData = toUint8(msg);
  const k = await crypto.subtle.importKey('raw', keyData.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, msgData.buffer as ArrayBuffer);
  return bufToHex(sig);
}

export function randomHex(bytes = 16): string {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}
