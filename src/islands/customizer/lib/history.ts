/** Undo/redo as a stack of immutable snapshots (max 50). */
export class History<T> {
  private past: T[] = [];
  private future: T[] = [];

  constructor(private readonly max = 50) {}

  /** Record the state as it was before a change. */
  record(previous: T): void {
    this.past.push(previous);
    if (this.past.length > this.max) this.past.shift();
    this.future = [];
  }

  undo(current: T): T | null {
    const previous = this.past.pop();
    if (previous === undefined) return null;
    this.future.push(current);
    return previous;
  }

  redo(current: T): T | null {
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(current);
    return next;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }
  get canRedo(): boolean {
    return this.future.length > 0;
  }
  clear(): void {
    this.past = [];
    this.future = [];
  }
}
