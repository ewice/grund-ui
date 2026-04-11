export function normalizeCheckboxGroupValues(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((value) => value != null).map((value) => String(value));
}

export function checkboxGroupValuesEqual(a: unknown, b: unknown): boolean {
  const left = normalizeCheckboxGroupValues(a);
  const right = normalizeCheckboxGroupValues(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
