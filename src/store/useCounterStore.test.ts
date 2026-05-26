import { describe, it, expect, beforeEach } from 'vitest';
import { useCounterStore } from './useCounterStore';

describe('useCounterStore', () => {
  beforeEach(() => {
    useCounterStore.getState().reset();
  });

  it('increments', () => {
    useCounterStore.getState().increment();
    expect(useCounterStore.getState().count).toBe(1);
  });

  it('decrements', () => {
    useCounterStore.getState().decrement();
    expect(useCounterStore.getState().count).toBe(-1);
  });

  it('resets', () => {
    useCounterStore.getState().increment();
    useCounterStore.getState().reset();
    expect(useCounterStore.getState().count).toBe(0);
  });
});
