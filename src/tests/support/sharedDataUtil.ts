/**
 * SharedDataUtil: Singleton data repository for persisting dynamic values
 * (e.g. generated account IDs, customer numbers, authentication tokens) across test steps.
 */
class SharedDataRepository {
  private static instance: SharedDataRepository;
  private store: Map<string, any>;

  private constructor() {
    this.store = new Map<string, any>();
  }

  public static getInstance(): SharedDataRepository {
    if (!SharedDataRepository.instance) {
      SharedDataRepository.instance = new SharedDataRepository();
    }
    return SharedDataRepository.instance;
  }

  public set(key: string, value: any): void {
    this.store.set(key, value);
  }

  public get<T = any>(key: string): T | undefined {
    return this.store.get(key) as T;
  }

  public has(key: string): boolean {
    return this.store.has(key);
  }

  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  /**
   * Replaces variables enclosed in `${key}` with values stored in the repository.
   */
  public interpolate(template: string): string {
    return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
      if (this.store.has(key)) {
        return String(this.store.get(key));
      }
      return match;
    });
  }
}

export const sharedDataUtil = SharedDataRepository.getInstance();
