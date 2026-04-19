import { LitElement } from 'lit';

export class GrundAvatarImage extends LitElement {}

if (!customElements.get('grund-avatar-image')) {
  customElements.define('grund-avatar-image', GrundAvatarImage);
}
