import { describe, expect, test } from 'vitest';
import { canRedo, canUndo, push, redo, start, undo } from './undo';

describe('undo', () => {
  test('undo and redo walk through the states', () => {
    let h = push(push(start('a'), 'b'), 'c');
    h = undo(h);
    expect(h.present).toBe('b');
    h = undo(h);
    expect(h.present).toBe('a');
    h = redo(h);
    expect(h.present).toBe('b');
  });

  test('a new change after undo drops the redo steps', () => {
    const h = push(undo(push(start('a'), 'b')), 'x');
    expect(h.present).toBe('x');
    expect(canRedo(h)).toBe(false);
  });

  test('nothing to undo or redo leaves the state unchanged', () => {
    const h = start('a');
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });

  test('keeps at most 100 undo steps', () => {
    let h = start(0);
    for (let i = 1; i <= 150; i++) h = push(h, i);
    for (let i = 0; i < 200; i++) h = undo(h);
    expect(h.present).toBe(50);
  });
});
