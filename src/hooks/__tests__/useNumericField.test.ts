// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNumericField } from '../useNumericField';

function setup(opts: { storeValue: number; validate?: (v: number) => boolean; format?: (v: number) => string }) {
  const onCommit = vi.fn();
  return {
    onCommit,
    ...renderHook(
      (props) => useNumericField({ ...props, onCommit }),
      { initialProps: { storeValue: opts.storeValue, validate: opts.validate, format: opts.format } },
    ),
  };
}

describe('useNumericField', () => {
  it('initializes with formatted store value', () => {
    const { result } = setup({ storeValue: 42 });
    expect(result.current.inputProps.value).toBe('42');
  });

  it('commits valid value on blur', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useNumericField({ storeValue: 0, onCommit }),
    );

    // Focus
    act(() => result.current.inputProps.onFocus());

    // Type "8"
    act(() =>
      result.current.inputProps.onChange({
        target: { value: '8' },
      } as React.ChangeEvent<HTMLInputElement>),
    );
    expect(result.current.inputProps.value).toBe('8');

    // Blur
    act(() => result.current.inputProps.onBlur());
    expect(onCommit).toHaveBeenCalledWith(8);
  });

  it('reverts to store value on invalid input blur', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useNumericField({ storeValue: 5, onCommit }),
    );

    act(() => result.current.inputProps.onFocus());
    act(() =>
      result.current.inputProps.onChange({
        target: { value: 'abc' },
      } as React.ChangeEvent<HTMLInputElement>),
    );
    act(() => result.current.inputProps.onBlur());

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.inputProps.value).toBe('5');
  });

  it('reverts on Escape key', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useNumericField({ storeValue: 10, onCommit }),
    );

    act(() => result.current.inputProps.onFocus());
    act(() =>
      result.current.inputProps.onChange({
        target: { value: '99' },
      } as React.ChangeEvent<HTMLInputElement>),
    );
    act(() =>
      result.current.inputProps.onKeyDown({
        key: 'Escape',
        currentTarget: { blur: vi.fn() },
      } as unknown as React.KeyboardEvent<HTMLInputElement>),
    );

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.inputProps.value).toBe('10');
  });

  it('accepts comma as decimal separator', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useNumericField({ storeValue: 0, onCommit }),
    );

    act(() => result.current.inputProps.onFocus());
    act(() =>
      result.current.inputProps.onChange({
        target: { value: '3,14' },
      } as React.ChangeEvent<HTMLInputElement>),
    );
    act(() => result.current.inputProps.onBlur());

    expect(onCommit).toHaveBeenCalledWith(3.14);
  });

  it('rejects value failing custom validation', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useNumericField({
        storeValue: 100,
        onCommit,
        validate: (v) => v > 0,
      }),
    );

    act(() => result.current.inputProps.onFocus());
    act(() =>
      result.current.inputProps.onChange({
        target: { value: '-5' },
      } as React.ChangeEvent<HTMLInputElement>),
    );
    act(() => result.current.inputProps.onBlur());

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.inputProps.value).toBe('100');
  });

  it('syncs from store when not focused', () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      (props) => useNumericField({ onCommit, ...props }),
      { initialProps: { storeValue: 10 } },
    );

    expect(result.current.inputProps.value).toBe('10');

    rerender({ storeValue: 20 });
    expect(result.current.inputProps.value).toBe('20');
  });

  it('does not sync from store while focused', () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      (props) => useNumericField({ onCommit, ...props }),
      { initialProps: { storeValue: 10 } },
    );

    act(() => result.current.inputProps.onFocus());
    act(() =>
      result.current.inputProps.onChange({
        target: { value: '15' },
      } as React.ChangeEvent<HTMLInputElement>),
    );

    rerender({ storeValue: 20 });
    expect(result.current.inputProps.value).toBe('15');
  });

  it('uses custom format function', () => {
    const { result } = setup({
      storeValue: 3.14159,
      format: (v) => v.toFixed(1),
    });
    expect(result.current.inputProps.value).toBe('3.1');
  });

  it('has correct input type and inputMode', () => {
    const { result } = setup({ storeValue: 0 });
    expect(result.current.inputProps.type).toBe('text');
    expect(result.current.inputProps.inputMode).toBe('decimal');
  });
});
