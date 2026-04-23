function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqualOrdered(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqualOrdered(a[i], b[i])) return false;
    }
    return true;
  }
  if (isObjectLike(a) && isObjectLike(b)) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (!deepEqualOrdered(aKeys, bKeys)) return false;
    return aKeys.every((key) => deepEqualOrdered(a[key], b[key]));
  }
  return false;
}

function deepEqualUnorderedArray(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const used = new Array<boolean>(b.length).fill(false);

  for (const item of a) {
    let matched = false;
    for (let i = 0; i < b.length; i += 1) {
      if (used[i]) continue;
      if (deepEqualOrdered(item, b[i])) {
        used[i] = true;
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }
  return true;
}

export function compareOutputs(
  expected: unknown,
  actual: unknown,
  options?: { ignoreArrayOrder?: boolean },
): boolean {
  if (
    options?.ignoreArrayOrder &&
    Array.isArray(expected) &&
    Array.isArray(actual)
  ) {
    return deepEqualUnorderedArray(expected, actual);
  }
  return deepEqualOrdered(expected, actual);
}
