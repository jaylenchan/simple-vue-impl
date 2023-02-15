import { isArray } from './../../shared/src/index';
import { isObject, hasChanged } from '@vue/shared';
import { track, trigger } from './effect';
import { TrackType, TriggerType } from './operators';
import { reactive } from './reactive';

function toReactive(val: unknown) {
  return isObject(val) ? reactive(val as Object) : val;
}
class RefImpl {
  public readonly _isRef: boolean = true;
  private _rawVal: unknown;
  private _value: unknown;
  private deep: boolean;

  constructor(rawVal: unknown, deep: boolean = true) {
    this._rawVal = rawVal;
    this._value = deep ? toReactive(rawVal) : rawVal;
    this.deep = deep;
  }

  get value() {
    track(TrackType.GET, this, 'value');
    return this._value;
  }

  set value(newVal: unknown) {
    if (hasChanged(this._rawVal, newVal)) {
      this._rawVal = newVal;
      this._value = this.deep ? toReactive(newVal) : newVal;
      trigger(TriggerType.SET, this, 'value', newVal);
    }
  }
}

function createRef(_value: unknown) {
  return new RefImpl(_value);
}

export function shallowRef(_value: unknown) {
  return createRef(_value);
}

export function ref(_value: unknown) {
  return createRef(_value);
}

class ObjectRefImpl<T extends object, K extends keyof T> {
  public readonly _isRef: boolean = true;
  public target: T;
  public key: K;

  constructor(target: T, key: K) {
    this.target = target;
    this.key = key;
  }

  get value() {
    return this.target[this.key];
  }

  set value(newVal) {
    this.target[this.key] = newVal;
  }
}

// 语法糖：将一个对象的属性拿出来单独使用的时候，想要响应式效果，就const name = toRef(obj,'name')，就可以直接使用name.value去操作收集依赖以及触发更新了
export function toRef<T extends object, K extends keyof T>(object: T, key: K) {
  return new ObjectRefImpl(object, key);
}

// 语法糖：批量的调用toRef
export function toRefs<T extends object>(object: T) {
  const ret: any = isArray(object) ? new Array(object.length) : {};

  for (const key in object) {
    ret[key] = toRef(object, key);
  }

  return ret;
}

/**
 * 1. ref(obj)可以这么用，但是一般对于object都会使用reactive(obj)
 * 2. toRefs(obj)相当于vue自己自定义了对响应式对象的解构，直接解构会失去响应式
 */
