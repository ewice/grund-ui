import { createContext } from '@lit/context';

import type { AvatarStatus } from './types';

export interface AvatarContext {
  /** Current loading status of the avatar image. */
  readonly status: AvatarStatus;
  /** Request a status transition. Idempotent — no-op when status is unchanged. */
  readonly setStatus: (next: AvatarStatus) => void;
}

export const avatarContext = createContext<AvatarContext>('avatar');
