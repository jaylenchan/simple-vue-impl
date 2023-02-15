import { TrackType, TriggerType } from './operators';
import {
  isArray,
  isInteger,
  hasProp,
  hasChanged
} from './../../shared/src/index';
import { track, trigger } from './effect';
import { readonly as Readonly, reactive } from './reactive';

function createGetter(deep: boolean = true, readonly: boolean = false) {
  return (target: Object, key: string, receiver: unknown): unknown => {
    const val = Reflect.get(target, key, receiver);

    /**
     * # 过滤掉readonly，shallowReadonly
     * # 留下reactive,shallowReactive需要track收集依赖
     */
    if (!readonly) {
      // 收集依赖
      track(TrackType.GET, target, key);
    }

    /**
     * # 过滤掉shallowReadonly和shallowReative
     * # 留下readonly和reactive递归转化响应式
     */
    if (!deep) {
      return val; 
    }

    return readonly ? Readonly(val) : reactive(val);
  };
}

function createSetter(deep: boolean) {
  console.log('setter deep', deep);
  return (target: Object, key: string, newVal: unknown, receiver: unknown) => {
    const flag = Reflect.set(target, key, newVal, receiver);
    const hasKey = isArray(target)
      ? isInteger(key) && +key < target.length
      : hasProp(target, key);
    const oldVal = Reflect.get(target, key);

    if (!hasKey) {
      trigger(TriggerType.ADD, target, key, newVal);
    } else {
      hasChanged(oldVal, newVal) &&
        trigger(TriggerType.SET, target, key, newVal, oldVal);
    }

    return flag;
  };
}

const shallowReactiveGetter = createGetter(false);
const reactiveGetter = createGetter(true);
const shallowReadonlyGetter = createGetter(false, true);
const readonlyGetter = createGetter(true, true);

const shallowReactiveSetter = createSetter(false);
const reactiveSetter = createSetter(true);
const readonlySetter = () => {
  console.warn('对象是只读的！');

  return false;
};

export const shallowReactiveHandler = {
  get: shallowReactiveGetter,
  set: shallowReactiveSetter
};

export const reactiveHandler = {
  get: reactiveGetter,
  set: reactiveSetter
};

export const shallowReadonlyHandler = {
  get: shallowReadonlyGetter,
  set: readonlySetter
};

export const readonlyHandler = {
  get: readonlyGetter,
  set: readonlySetter
};

/**
 * 1. createGetter: 不是readonly就需要收集依赖，否则如果是readonly只读，不需要收集依赖，因为并不会引起视图更新。
 */
