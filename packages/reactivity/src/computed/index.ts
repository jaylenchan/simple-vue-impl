import { isFunction } from '@vue/shared'
import { ReactiveEffect, effect, track, trigger } from '../effect';
import { TrackType, TriggerType } from '../operators';

type ComputedGetter = (...args: any[]) => unknown;
type ComputedSetter = (newVal: unknown) => void;
type ComputedOptions = { getter: ComputedGetter; setter: ComputedSetter };

class ComputedRefImpl {
  private useCache: boolean = false;
  private _value: unknown;
  private reactiveEffect: ReactiveEffect;
  private getter: ComputedGetter;
  private setter: ComputedSetter;

  constructor(getter: ComputedGetter, setter: ComputedSetter) {
    this.getter = getter;
    this.setter = setter;
    this.reactiveEffect = effect(this.getter, {
      lazy: true,
      scheduler: () => {
        if (this.useCache) {
          // 这里的缓存更改为false的逻辑作用是为了防止变成缓存状态后，一直用的计算属性的缓存值了
          // 为了能够更改，我们让const mage = computed(() => age.value + 1)内部的依赖age，在修改age.value
          // 的时候重新触发我们指定的scheduler（effect指定了这个scheduler，就走这边的逻辑）
          // 当下次再使用计算属性mage.value的时候就可以拿到新值了
          this.useCache = false;
          // 但是考虑场景如下
          /**
           * const mage = computed(() => age.value + 1)
           * effect(() => { // reactiveEffectA
           *   app.innerHTML = mage.value
           * })
           * 
           * age.value += 1
           * 
           * 此时就需要立即触发mage对应的reactiveEffectA的再次执行
           * 因此我们也要对计算属性进行依赖收集
           */
          trigger(this, TriggerType.SET, 'value');
        }
      }
    });
  }

  get value() {
    if (!this.useCache) {
      this._value = this.reactiveEffect();
      this.useCache = true;
    }

    // 考虑场景如下
    /**
     * const mage = computed(() => age.value + 1)
     * effect(() => { // reactiveEffectA
     *   app.innerHTML = mage.value
     * })
     * 
     * age.value += 1
     * 
     * 此时也需要触发mage对应的reactiveEffectA的更新
     * 因此我们也要对计算属性进行依赖收集
     */
    track(this, TrackType.GET, 'value');

    return this._value;
  }

  set value(newVal: unknown) {
    this.setter(newVal);
  }
}

/**
 * 使用方式1：只传getter函数
 * const age = computed(() => {
 *  return state.value + 1
 * })
 * 
 * 使用方式2：getter和setter都传入
 * const name = computed({
 *  get() {
 *   },
 * 
 *   set() {
 *   }
 * })
 * 
 * 默认getter函数不执行，当访问age.value或者name.value 的时候，才会触发函数执行
 * 
 */

export function computed(options: ComputedGetter | ComputedOptions) {
  let getter: ComputedGetter = () => { };
  let setter: ComputedSetter = () => console.warn('对象是只读的！');

  if (isFunction(options)) {
    getter = options as ComputedGetter;
  } else {
    getter = (options as ComputedOptions).getter;
    setter = (options as ComputedOptions).setter;
  }

  return new ComputedRefImpl(getter, setter);
}
