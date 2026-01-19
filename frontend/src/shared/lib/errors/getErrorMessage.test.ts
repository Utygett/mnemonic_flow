import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  describe('пустые значения', () => {
    it('должен вернуть пустую строку для null', () => {
      expect(getErrorMessage(null)).toBe('');
    });

    it('должен вернуть пустую строку для undefined', () => {
      expect(getErrorMessage(undefined)).toBe('');
    });

    it('должен вернуть пустую строку для пустой строки', () => {
      expect(getErrorMessage('')).toBe('');
    });
  });

  describe('строки', () => {
    it('должен вернуть строку как есть', () => {
      expect(getErrorMessage('Ошибка сети')).toBe('Ошибка сети');
    });

    it('должен вернуть строку с пробелами', () => {
      expect(getErrorMessage('  test  ')).toBe('  test  ');
    });
  });

  describe('Error объекты', () => {
    it('должен вернуть message из Error', () => {
      const err = new Error('Что-то пошло не так');
      expect(getErrorMessage(err)).toBe('Что-то пошло не так');
    });

    it('должен вернуть detail если есть', () => {
      const err = new Error('message');
      (err as any).detail = 'Детальное описание ошибки';
      expect(getErrorMessage(err)).toBe('Детальное описание ошибки');
    });

    it('должен предпочитать detail над message', () => {
      const err = new Error('message');
      (err as any).detail = 'detail text';
      expect(getErrorMessage(err)).toBe('detail text');
    });
  });

  describe('произвольные объекты', () => {
    it('должен вернуть detail из объекта', () => {
      const obj = { detail: 'error detail' };
      expect(getErrorMessage(obj)).toBe('error detail');
    });

    it('должен вернуть message из объекта', () => {
      const obj = { message: 'error message' };
      expect(getErrorMessage(obj)).toBe('error message');
    });

    it('должен предпочитать detail над message', () => {
      const obj = { message: 'msg', detail: 'det' };
      expect(getErrorMessage(obj)).toBe('det');
    });

    it('должен сериализовать объект в JSON', () => {
      const obj = { code: 500, text: 'Server error' };
      expect(getErrorMessage(obj)).toBe('{"code":500,"text":"Server error"}');
    });

    it('должен вернуть строку для объекта который нельзя сериализовать', () => {
      const obj = { fn: () => {} };
      const result = getErrorMessage(obj);
      // JSON.stringify игнорирует функции, возвращая "{}"
      expect(result).toBe('{}');
    });
  });

  describe('числа и прочие типы', () => {
    it('должен вернуть строку для числа', () => {
      expect(getErrorMessage(404)).toBe('404');
    });

    it('должен вернуть строку для boolean', () => {
      expect(getErrorMessage(true)).toBe('true');
    });
  });
});
