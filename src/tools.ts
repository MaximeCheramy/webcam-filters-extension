export function clamp(value: number, a: number, b: number): number {
  if (value < a) {
    return a
  }
  if (value > b) {
    return b
  }
  return value
}
