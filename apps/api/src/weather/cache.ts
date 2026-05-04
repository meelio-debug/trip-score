type Entry<V> = { value: V; expires: number };

export class TtlCache<V> {
  private readonly store = new Map<string, Entry<V>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}
