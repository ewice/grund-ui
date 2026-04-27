import type { AvatarStatus, Listener } from './types';

export class AvatarEngine {
  private _status: AvatarStatus = 'idle';
  private readonly listeners = new Set<Listener>();

  public get status(): AvatarStatus {
    return this._status;
  }

  public setStatus(next: AvatarStatus): void {
    if (next === this._status) {
      return;
    }

    this._status = next;

    for (const listener of this.listeners) {
      listener(next);
    }
  }

  public onChange(listener: Listener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}
