export function slice<T>(arr: T[], limit = 50, offset = 0) {
  return arr.slice(offset, offset + limit);
}

export function pickFields<T extends Record<string, any>>(obj: T, fields?: string) {
  if (!fields) return obj;
  const keys = fields.split(",").map(s => s.trim()).filter(Boolean);
  const out: Record<string, any> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

export function applyFields<T extends Record<string, any>>(list: T[], fields?: string) {
  return list.map(item => pickFields(item, fields));
}
