declare global {
  namespace App {}
  // The kit keeps in-source vitest tests; the site never runs them.
  interface ImportMeta {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly vitest?: any;
  }
}

export {};
