import { css } from 'lit';

export const accordionPanelStyles = css`
  :host {
    display: block;
  }

  :host([data-state='closed']:not([data-hidden-until-found])) [part='panel'] {
    display: none;
  }
`;
