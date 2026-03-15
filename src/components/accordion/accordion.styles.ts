import { css } from 'lit';

export const accordionStyles = css`
  :host {
    display: block;
  }
`;

export const accordionItemStyles = css`
  :host {
    display: block;
  }
`;

export const accordionHeaderStyles = css`
  :host {
    display: block;
  }

  [part='heading'] {
    margin: 0;
    padding: 0;
  }
`;

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

  :host([disabled]) [part='trigger'] {
    cursor: default;
  }
`;

export const accordionPanelStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }
`;
