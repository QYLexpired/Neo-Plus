let generation = 0;
let active = false;
export function beginNeoLifecycle(): void {
  generation += 1;
  active = true;
}
export function endNeoLifecycle(): void {
  active = false;
  generation += 1;
}
export function createNeoLifecycleGuard(): () => boolean {
  const currentGeneration = generation;
  return () => active && generation === currentGeneration;
}
