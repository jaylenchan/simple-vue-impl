import { isObject, hasChanged, isArray } from '@vue3/shared';
import { track, trigger } from '../effect';
import { TrackType, TriggerType } from '../operators';
import { reactive } from '../reactive';

function toReactive(val: unknown) {
  return isObject(val) ? reactive(val as Object) : val;
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
// 其实就是简单加了个中间值value，用对象的形式obj.value方式调用，防止响应式解构失效。比如这个name其实就是一个ObjectImpl结构，限制了必须通过name.value进行访问
// 由于这个value会被拦截，所以就会转发内部真正的target的值，设置的时候也会设置给target
// 像想通过解构的方式从proxy代理响应式结构中进行取值单独用，为了防止响应式失效，就必须这么用。其实这个就是vue为了替换普通解构定制的响应式解构的方式。

export function toRef<T extends object, K extends keyof T>(object: T, key: K) {
  return new ObjectRefImpl(object, key);
}

// 语法糖：批量的调用toRef
// toRefs其实就是响应式解构
// const { a,b,c } = toRefs(proxy)
// 对标普通解构 const { a,b,c} = target
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
class RefImpl {
  public readonly _isRef: boolean = true;
  private _rawValue: unknown;
  private _value: unknown;

  constructor(rawValue: unknown, public readonly shallow: boolean) {
    this._rawValue = rawValue;
    // 初始化的时候，如果发现传入的是对象，其实会在内部这里调用reactive(rawValue)
    this._value = shallow ? rawValue : toReactive(rawValue)
  }

  get value() {
    // 取值的时候，一样要收集依赖reactiveEffects
    // 如果不在effect当中使用ref变量，则依赖收集的时候，对应reactiveEffect一定是空的，”value“此时不会进行依赖关联，进去track逻辑压根不会继续进行，会直接绕过
    track(this, TrackType.GET, 'value');
    return this._value;
  }

  set value(newVal: unknown) {
    if (hasChanged(this._rawValue, newVal)) {
      this._rawValue = newVal;
      this._value = this.shallow ? newVal : toReactive(newVal);
      // 设置值的时候，一样要触发reactiveEffects重新执行
      // 由于在trigger内部有这么一句代码：const deps = depCache.get(target);
      // 那么如果不是在effect当中使用ref变量，则deps拿到的就一定是空值。因为target在ref情况下，只有"value"这个key
      trigger(this, TriggerType.SET, 'value', newVal);
    }
  }
}

export function shallowRef(_value: unknown) {
  return new RefImpl(_value, true);
}

export function ref(_value: unknown) {
  return new RefImpl(_value, false);
}

/**
 * 1. ref和reactive的区别：ref内部用的Object.defineProperty(class的方式下就是定义getter和setter，转es5就是defineProperty) ，reactive内部用的proxy
 * 2. Object.defineProperty的方式只能针对一个key拦截，而proxy能针对一个对象拦截
 * 3. 所以ref对value的使用过程就是在针对value的取值和设置值进行拦截的过程
 */