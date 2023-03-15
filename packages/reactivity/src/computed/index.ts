import { isFunction } from '../../../shared/src/index';
import { Effect, effect, track, trigger } from '../effect';
import { TrackType, TriggerType } from '../operators';

type ComputedGetter = (...args: any[]) => unknown;
type ComputedSetter = (newVal: unknown) => void;
type ComputedOptions = { getter: ComputedGetter; setter: ComputedSetter };

class ComputedRefImpl {
  private useCache: boolean = false;
  private _value: unknown;
  private reactiveEffect: Effect;
  private getter: ComputedGetter;
  private setter: ComputedSetter;

  constructor(getter: ComputedGetter, setter: ComputedSetter) {
    this.getter = getter;
    this.setter = setter;
    this.reactiveEffect = effect(this.getter, {
      lazy: true,
      scheduler: () => {
        if (this.useCache) {
          this.useCache = false;
          trigger(TriggerType.SET, this, 'value');
        }
      }
    });
  }

  get value() {
    if (!this.useCache) {
      this._value = this.reactiveEffect();
      this.useCache = true;
    }
    track(TrackType.GET, this, 'value');

    return this._value;
  }

  set value(newVal: unknown) {
    this.setter(newVal);
  }
}

export function computed(options: ComputedGetter | ComputedOptions) {
  let getter: ComputedGetter = () => {};
  let setter: ComputedSetter = () => console.warn('对象是只读的！');

  if (isFunction(options)) {
    getter = options as ComputedGetter;
  } else {
    getter = (options as ComputedOptions).getter;
    setter = (options as ComputedOptions).setter;
  }

  return new ComputedRefImpl(getter, setter);
}
