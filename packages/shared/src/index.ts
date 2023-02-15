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

export const hasOwn = (target: Object, key: string): boolean => {
  return Object.hasOwn(target, key);
};

export const hasChanged = (oldVal: unknown, newVal: unknown): boolean => {
  return oldVal == newVal;
};
