// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from './useToast';

describe('useToast hook', () => {
  it('starts with an empty toast array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds error, success, info, and warning toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Berhasil', 'Operasi sukses');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'success',
      title: 'Berhasil',
      message: 'Operasi sukses',
      duration: 3500,
    });

    act(() => {
      result.current.showError('Gagal', 'Terjadi kesalahan');
      result.current.showInfo('Info', 'Informasi terkini');
      result.current.showWarning('Peringatan', 'Harap hati-hati');
    });

    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts.map((t) => t.type)).toEqual([
      'success',
      'error',
      'info',
      'warning',
    ]);
  });

  it('prevents adding duplicate toasts with identical title and message', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Pitch Shifter', '+2 Semitone');
      result.current.showInfo('Pitch Shifter', '+2 Semitone');
    });

    expect(result.current.toasts).toHaveLength(1);
  });

  it('caps max toasts at 4 by slicing oldest', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Toast 1');
      result.current.showInfo('Toast 2');
      result.current.showInfo('Toast 3');
      result.current.showInfo('Toast 4');
      result.current.showInfo('Toast 5');
    });

    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts.map((t) => t.title)).toEqual([
      'Toast 2',
      'Toast 3',
      'Toast 4',
      'Toast 5',
    ]);
  });

  it('dismisses a toast by id', () => {
    const { result } = renderHook(() => useToast());

    let toastId = '';
    act(() => {
      toastId = result.current.showSuccess('Simpan', 'Tersimpan');
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
