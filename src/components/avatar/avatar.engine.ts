import type { AvatarStatus } from './types';

type Listener = (status: AvatarStatus) => void;

/**
 * Pure state and action resolution for the avatar image-loading lifecycle.
 * No DOM access, no Lit dependency.
 * @internal
 */
export class AvatarEngine {
  private _status: AvatarStatus = 'idle';
  private readonly _listeners = new Set<Listener>();

  public get status(): AvatarStatus {
    return this._status;
  }

  public setStatus(next: AvatarStatus): void {
    if (next === this._status) return;
    this._status = next;
    for (const listener of this._listeners) {
      listener(next);
    }
  }

  public onChange(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }
}
