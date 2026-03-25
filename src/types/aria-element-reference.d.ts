/**
 * TypeScript DOM lib augmentation for the ARIA Element Reference API.
 *
 * These properties are part of the ARIA in HTML specification and supported in modern
 * browsers, but not yet included in TypeScript's bundled lib.dom.d.ts. Declaring them
 * here eliminates `as any` casts at every call site that sets cross-shadow ARIA links.
 *
 * Remove this file once TypeScript ships DOM types that include these properties.
 * Track: https://github.com/microsoft/TypeScript/issues/46456
 */
declare global {
  interface Element {
    /** Sets the aria-controls relationship via element reference — works cross-shadow-root. */
    ariaControlsElements: Element[] | null;
    /** Sets the aria-labelledby relationship via element reference — works cross-shadow-root. */
    ariaLabelledByElements: Element[] | null;
    /** Sets the aria-describedby relationship via element reference — works cross-shadow-root. */
    ariaDescribedByElements: Element[] | null;
    /** Sets the aria-owns relationship via element reference — works cross-shadow-root. */
    ariaOwnsElements: Element[] | null;
    /** Sets the aria-details relationship via element reference — works cross-shadow-root. */
    ariaDetailsElements: Element[] | null;
    /** Sets the aria-flowto relationship via element reference — works cross-shadow-root. */
    ariaFlowToElements: Element[] | null;
    /** Sets the aria-activedescendant relationship via element reference — works cross-shadow-root. */
    ariaActiveDescendantElement: Element | null;
    /** Sets the aria-errormessage relationship via element reference — works cross-shadow-root. */
    ariaErrorMessageElements: Element[] | null;
  }
}

export {};
