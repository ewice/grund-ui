import { createContext } from '@lit/context';

import type { AvatarStatus } from './types';

export interface AvatarContext {
  readonly status: AvatarStatus;
  readonly setStatus: (next: AvatarStatus) => void;
}

export const avatarContext = createContext<AvatarContext>('avatar');
