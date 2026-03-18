import { css } from 'lit';

export const accordionTriggerStyles = css`
  :host {
    display: block;
  }

  [part='trigger'] {
    all: unset;
    display: flex;
    cursor: pointer;
    box-sizing: border-box;
    width: 100%;
  }

  [part='trigger']:focus-visible {
    outline: revert;
  }

  :host([disabled]) [part='trigger'],
  :host([data-disabled]) [part='trigger'] {
    cursor: default;
  }
`;
