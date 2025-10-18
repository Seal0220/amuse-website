export default function createPerlinNoise() {
  const perm = new Uint8Array(512);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (hash, x) => ((hash & 1) === 0 ? x : -x);
  return (x) => {
    const X = Math.floor(x) & 255;
    const xf = x - Math.floor(x);
    const u = fade(xf);
    const a = perm[X];
    const b = perm[X + 1];
    return (1 - u) * grad(a, xf) + u * grad(b, xf - 1);
  };
}