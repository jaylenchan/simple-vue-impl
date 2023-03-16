import { isObject } from '@vue3/shared';
import {
  reactiveHandler,
  readonlyHandler,
  shallowReactiveHandler,
  shallowReadonlyHandler
} from './baseHandlers';

const reactiveCache = new WeakMap<Object, Object>();
const readonlyCache = new WeakMap<Object, Object>();

/**
 * 根据条件将对象转换成响应式对象 | 只读响应式对象
 * @param target 被代理的对象
 * @param readonly 是否只读
 * @returns proxy代理对象
 */
function createReactiveObject(
  target: Object,
  handler: ProxyHandler<Object>,
  readonly: boolean,
) {
  // 只能代理对象，普通值直接返回
  if (!isObject(target)) {
    return target;
  }

  const cache = readonly ? readonlyCache : reactiveCache;

  let proxy = cache.get(target)

  if (!proxy) {
    proxy = new Proxy(target, handler)
    cache.set(target, proxy);
  }

  return proxy
}

export function shallowReactive(target: Object) {
  return createReactiveObject(target, shallowReactiveHandler, false);
}

export function reactive(target: Object) {
  return createReactiveObject(target, reactiveHandler, false);
}

export function shallowReadonly(target: Object) {
  return createReactiveObject(target, shallowReadonlyHandler, true)
}

export function readonly(target: Object) {
  return createReactiveObject(target, readonlyHandler, true);
}

/**
 * 1. shallowReactive|reactive|shallowReadonly|readonly四个函数的本质区别在于handlers的不同，对set的限制导致了只读readonly的产生。
 * 2. 一个target被代理过后，需要被缓存起来，无需重复代理。一个target可能被使用上两种纬度的代理，一种是reactive，一种是readonly。假如仅仅
 *    用一个cache缓存两个纬度所有proxy，那么对同一个target，使用reactive和readonly就会互斥，没法两个都存。但我们不需要管一个纬度的，比如reactive，
 *    不可能一个对象被代理成shallowReactive，又被代理成reactive。所以只需要在大纬度上进行区分，用readonlyCache和reactiveCache分别存放两个纬度上
 *    的对象代理，允许一个obj被readonly(obj)，又被reactive(obj) 【❓课程疑问（ReactiveApi实现：23分钟31秒处）：怎么可能同一个对象被readonly和reactive同时启用？？？】
 * 3. 使用WeakMap只能是对象类型的key，不能存非对象。好处是会自动回收内存，不会造成内存泄露。
 */


/**
 * 1. shallowReactive|reactive|shallowReadonly|readonly 四个API的统一作用：创建一个Proxy代理，只不过由于handler的不同，导致行为的差异。它们的唯一区别就是：是否只读？是否浅代理？
 * 2. 创建createReactiveObject的第三个参数决定代理的存取和设置是从readonlyCache取还是从reactiveCache取。对象只会被代理一次，如果多次进行API调用，只会从缓存中取出返回。
 * 3. shallowReadonly|readonly 两个API的setter无效，因为是只读的。代理时观察用户的set行为，如果发现有set行为，拦截后不进行值设置。
 */