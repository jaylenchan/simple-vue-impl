export const merge = Object.assign;

export const isArray = Array.isArray;

export const isFunction = (val: unknown): boolean => {
  return typeof val == 'function';
};

export const isNumber = (val: unknown): boolean => {
  return typeof val == 'number';
};

export const isString = (val: unknown): boolean => {
  return typeof val == 'string';
};

export const isInteger = (val: string): boolean => {
  return String(parseInt(val)) == val;
};

export const isObject = (val: unknown): boolean => {
  return typeof val == 'object' && val != null;
};

export const isPlainObject = (val: unknown): boolean => {
  return Object.prototype.toString.call(val) === '[object Object]'
}

export const hasOwn = (target: Object, key: string): boolean => {
  return Object.prototype.hasOwnProperty.call(target, key);
};

export const hasChanged = (oldVal: unknown, newVal: unknown): boolean => {
  return oldVal != newVal;
};

export const isEvent = (key: string): boolean => {
  return /^on[^a-z]+/.test(key)
}

export { ShapeFlags } from './shapeFlags'