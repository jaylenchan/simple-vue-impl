import { isObject } from '@vue/shared';
import {
  reactiveHandler,
  readonlyHandler,
  shallowReactiveHandler,
  shallowReadonlyHandler
} from './handlers';

const reactiveCache = new WeakMap<Object, Object>();
const readonlyCache = new WeakMap<Object, Object>();

/**
 * 根据条件将对象转换成响应式对象 | 只读响应式对象
 * @param target 被代理的对象
 * @param readonly 是否只读
 * @returns proxy代理对象
 */
function createReactiveObject(
  readonly: boolean,
  target: Object,
  handler: ProxyHandler<Object>
) {
  if (!isObject(target)) {
    return target;
  }

  const cache = readonly ? readonlyCache : reactiveCache;

  if (!cache.has(target)) {
    cache.set(target, new Proxy(target, handler));
  }

  return cache.get(target)!;
}

export function shallowReactive(target: Object) {
  return createReactiveObject(false, target, shallowReactiveHandler);
}

export function reactive(target: Object) {
  return createReactiveObject(false, target, reactiveHandler);
}

export function shallowReadonly(target: Object) {
  return createReactiveObject(true, target, shallowReadonlyHandler);
}

export function readonly(target: Object) {
  return createReactiveObject(true, target, readonlyHandler);
}

/**
 * 1. shallowReactive|reactive|shallowReadonly|readonly四个函数的本质区别在于handlers的不同，对set的限制导致了只读readonly的产生。
 * 2. 一个target被代理过后，需要被缓存起来，无需重复代理。一个target可能被使用上两种纬度的代理，一种是reactive，一种是readonly。假如仅仅
 *    用一个cache缓存两个纬度所有proxy，那么对同一个target，使用reactive和readonly就会互斥，没法两个都存。但我们不需要管一个纬度的，比如reactive，
 *    不可能一个对象被代理成shallowReactive，又被代理成reactive。所以只需要在大纬度上进行区分，用readonlyCache和reactiveCache分别存放两个纬度上
 *    的对象代理，允许一个obj被readonly(obj)，又被reactive(obj) 【❓课程疑问（ReactiveApi实现：23分钟31秒处）：怎么可能同一个对象被readonly和reactive同时启用？？？】
 * 3. 使用WeakMap只能是对象类型的key，不能存非对象。好处是会自动回收内存，不会造成内存泄露。
 */
