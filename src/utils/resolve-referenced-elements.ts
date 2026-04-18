/**
 * Resolves a whitespace-separated IDREF string to an array of HTMLElements,
 * scoped to the root node of the given reference element so IDs inside a
 * shadow root are found correctly.
 * @internal
 */
export function resolveReferencedElements(
  idref: string | null | undefined,
  reference: Node,
): HTMLElement[] {
  if (!idref || !idref.trim()) {
    return [];
  }

  const root = reference.getRootNode();
  const scope =
    root instanceof Document || root instanceof ShadowRoot
      ? root
      : ((reference as Node & { ownerDocument?: Document }).ownerDocument ?? null);

  if (!scope) {
    return [];
  }

  return idref
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce<HTMLElement[]>((acc, id) => {
      const el = scope.getElementById(id);

      if (el instanceof HTMLElement) {
        acc.push(el);
      }

      return acc;
    }, []);
}
