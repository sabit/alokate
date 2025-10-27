export const normalizeSeed = (seed?: number) => {
  if (!seed || seed <= 0) {
    return 42;
  }
  return seed;
};
