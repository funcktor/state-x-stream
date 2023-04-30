export default function shallowEqual(a: any, b: any) {
  const k1 = Object.keys(a);
  const k2 = Object.keys(b);
  const sameKeys = k1.length === k2.length;
  return sameKeys && !k1.find((k) => a[k] !== b[k]);
}
