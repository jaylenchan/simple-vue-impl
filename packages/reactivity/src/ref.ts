import { hasChanged } from './../../shared/src/index';
import { track, trigger } from './effect';
import { TrackType, TriggerType } from './operators';

class RefImpl {
  private _value: unknown;
  public rawVal: unknown;
  public readonly _isRef: boolean;

  constructor(rawVal: unknown, deep: boolean) {
    console.log(deep);
    this._value = rawVal;
    this.rawVal = rawVal;
    this._isRef = true;
  }

  get value() {
    track(TrackType.GET, this, 'value');
    return this._value;
  }

  set value(newVal: unknown) {
    if (hasChanged(this.rawVal, newVal)) {
      this._value = newVal;
      this.rawVal = newVal;
      trigger(TriggerType.SET, this, 'value', newVal);
    }
  }
}

function createRef(_value: unknown, deep: boolean = true) {
  return new RefImpl(_value, deep);
}

export function shallowRef(_value: unknown) {
  return createRef(_value, false);
}

export function ref(_value: unknown) {
  return createRef(_value);
}

export function toRef() {}

export function toRefs() {}
