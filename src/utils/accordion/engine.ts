export type AccordionActionType = 'toggle' | 'open';

export interface AccordionAction {
  type: AccordionActionType;
  value: string;
}

export interface AccordionActionInput {
  action: AccordionAction;
  expandedValues: readonly string[];
  itemOrder: readonly string[];
  disabledValues: ReadonlySet<string>;
  multiple: boolean;
}

export interface AccordionActionResult {
  changed: boolean;
  value: string;
  expanded: boolean;
  nextValues: string[];
}

export function normalizeAccordionValues(
  values: readonly string[],
  options: { multiple: boolean },
): string[] {
  return options.multiple ? [...values] : values.slice(0, 1);
}

export function resolveAccordionAction(input: AccordionActionInput): AccordionActionResult {
  const currentValues = orderAccordionValues(
    normalizeAccordionValues(input.expandedValues, { multiple: input.multiple }),
    input.itemOrder,
  );
  const currentValuesSet = new Set(currentValues);
  const isDisabled = input.disabledValues.has(input.action.value);

  if (isDisabled) {
    return {
      changed: false,
      value: input.action.value,
      expanded: currentValuesSet.has(input.action.value),
      nextValues: currentValues,
    };
  }

  const nextValues = buildNextValues(input, currentValues, currentValuesSet);
  const orderedNextValues = orderAccordionValues(nextValues, input.itemOrder);
  const changed = !areValuesEqual(currentValues, orderedNextValues);

  return {
    changed,
    value: input.action.value,
    expanded: orderedNextValues.includes(input.action.value),
    nextValues: orderedNextValues,
  };
}

function buildNextValues(
  input: AccordionActionInput,
  currentValues: readonly string[],
  currentValuesSet: ReadonlySet<string>,
): string[] {
  const value = input.action.value;

  if (input.action.type === 'open') {
    if (currentValuesSet.has(value)) {
      return [...currentValues];
    }

    return input.multiple ? [...currentValues, value] : [value];
  }

  if (currentValuesSet.has(value)) {
    return currentValues.filter((itemValue) => itemValue !== value);
  }

  return input.multiple ? [...currentValues, value] : [value];
}

function orderAccordionValues(values: readonly string[], itemOrder: readonly string[]): string[] {
  const nextValues = new Set(values);
  const orderedValues = itemOrder.filter((itemValue) => nextValues.has(itemValue));

  for (const value of nextValues) {
    if (!orderedValues.includes(value)) {
      orderedValues.push(value);
    }
  }

  return orderedValues;
}

function areValuesEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}
