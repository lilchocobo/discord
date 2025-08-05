export function useSetupE2EE() {
  // Disable encryption by always returning undefined
  const e2eePassphrase = undefined;

  const worker: Worker | undefined = undefined;

  return { worker, e2eePassphrase };
}
