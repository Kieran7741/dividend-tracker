import { loadFromStorage, saveToStorage } from './storage';

describe('storage utilities', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Spy on console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('loadFromStorage', () => {
    it('should return default value when key does not exist', () => {
      const result = loadFromStorage('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return stored value when key exists', () => {
      localStorage.setItem('testKey', JSON.stringify({ foo: 'bar' }));
      const result = loadFromStorage('testKey', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return default value for different data types', () => {
      expect(loadFromStorage('test1', 42)).toBe(42);
      expect(loadFromStorage('test2', true)).toBe(true);
      expect(loadFromStorage('test3', [])).toEqual([]);
      expect(loadFromStorage('test4', { key: 'value' })).toEqual({ key: 'value' });
    });

    it('should parse stored JSON correctly', () => {
      localStorage.setItem('array', JSON.stringify([1, 2, 3]));
      localStorage.setItem('object', JSON.stringify({ a: 1, b: 2 }));
      localStorage.setItem('number', JSON.stringify(123));
      localStorage.setItem('boolean', JSON.stringify(true));

      expect(loadFromStorage('array', [])).toEqual([1, 2, 3]);
      expect(loadFromStorage('object', {})).toEqual({ a: 1, b: 2 });
      expect(loadFromStorage('number', 0)).toBe(123);
      expect(loadFromStorage('boolean', false)).toBe(true);
    });

    it('should return default value when stored value is invalid JSON', () => {
      localStorage.setItem('invalid', 'not valid JSON{');
      const result = loadFromStorage('invalid', 'default');
      expect(result).toBe('default');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load invalid from storage:',
        expect.any(Error)
      );
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage.getItem to throw an error
      jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      const result = loadFromStorage('errorKey', 'default');
      expect(result).toBe('default');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load errorKey from storage:',
        expect.any(Error)
      );
    });
  });

  describe('saveToStorage', () => {
    it('should save string value to localStorage', () => {
      saveToStorage('key', 'value');
      expect(localStorage.getItem('key')).toBe(JSON.stringify('value'));
    });

    it('should save object to localStorage', () => {
      const obj = { foo: 'bar', num: 42 };
      saveToStorage('objKey', obj);
      expect(localStorage.getItem('objKey')).toBe(JSON.stringify(obj));
    });

    it('should save array to localStorage', () => {
      const arr = [1, 2, 3, 4, 5];
      saveToStorage('arrKey', arr);
      expect(localStorage.getItem('arrKey')).toBe(JSON.stringify(arr));
    });

    it('should save number to localStorage', () => {
      saveToStorage('numKey', 123);
      expect(localStorage.getItem('numKey')).toBe('123');
    });

    it('should save boolean to localStorage', () => {
      saveToStorage('boolKey', true);
      expect(localStorage.getItem('boolKey')).toBe('true');
    });

    it('should save null to localStorage', () => {
      saveToStorage('nullKey', null);
      expect(localStorage.getItem('nullKey')).toBe('null');
    });

    it('should overwrite existing value', () => {
      saveToStorage('key', 'first');
      expect(localStorage.getItem('key')).toBe(JSON.stringify('first'));
      
      saveToStorage('key', 'second');
      expect(localStorage.getItem('key')).toBe(JSON.stringify('second'));
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage.setItem to throw an error
      jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      saveToStorage('errorKey', 'value');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save errorKey to storage:',
        expect.any(Error)
      );
    });
  });

  describe('integration - save and load', () => {
    it('should correctly save and load complex objects', () => {
      const complexObj = {
        id: '123',
        name: 'Test',
        values: [1, 2, 3],
        nested: {
          foo: 'bar',
          baz: true,
        },
      };

      saveToStorage('complex', complexObj);
      const loaded = loadFromStorage('complex', {});
      expect(loaded).toEqual(complexObj);
    });

    it('should handle empty arrays and objects', () => {
      saveToStorage('emptyArray', []);
      saveToStorage('emptyObject', {});

      expect(loadFromStorage('emptyArray', null)).toEqual([]);
      expect(loadFromStorage('emptyObject', null)).toEqual({});
    });
  });
});
