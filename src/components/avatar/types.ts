export type AvatarStatus = 'idle' | 'loading' | 'loaded' | 'error';

export interface AvatarStatusChangeDetail {
  status: AvatarStatus;
}

export type Listener = (status: AvatarStatus) => void;