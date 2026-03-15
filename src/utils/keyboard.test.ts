import { describe, it, expect } from 'vitest';
import { Keys } from './keyboard';

describe('Keys', () => {
  it('exports standard key constants', () => {
    expect(Keys.ENTER).toBe('Enter');
    expect(Keys.SPACE).toBe(' ');
    expect(Keys.ESCAPE).toBe('Escape');
    expect(Keys.ARROW_DOWN).toBe('ArrowDown');
    expect(Keys.ARROW_UP).toBe('ArrowUp');
    expect(Keys.HOME).toBe('Home');
    expect(Keys.END).toBe('End');
  });
});
