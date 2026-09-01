let generation = 0;
let neoLifecycleActive = false;
export function beginNeoLifecycle(): void {
  generation += 1;
  neoLifecycleActive = true;
}
export function endNeoLifecycle(): void {
  neoLifecycleActive = false;
  generation += 1;
}
export function createNeoLifecycleGuard(): () => boolean {
  const currentGeneration = generation;
  return () => neoLifecycleActive && generation === currentGeneration;
}
