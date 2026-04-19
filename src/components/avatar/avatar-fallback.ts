import { LitElement } from 'lit';

export class GrundAvatarFallback extends LitElement {}

if (!customElements.get('grund-avatar-fallback')) {
  customElements.define('grund-avatar-fallback', GrundAvatarFallback);
}
