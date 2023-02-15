import { isArray, isInteger } from './../../shared/src/index';
import { TrackType, TriggerType } from './operators';
type Effect = (...args: unknown[]) => void;

let uid = 0;
const effectStack: Effect[] = [];
const depCache = new WeakMap<Object, Map<string, Set<Effect>>>();

function createReactiveEffect(fn: Function, options: unknown = {}) {
  const reactiveEffect = () => {
    if (!effectStack.includes(reactiveEffect)) {
      try {
        effectStack.push(reactiveEffect);
        return fn();
      } finally {
        effectStack.pop();
      }
    }
  };

  reactiveEffect['id'] = uid++;
  reactiveEffect['_isEffect'] = true;
  reactiveEffect['raw'] = fn;
  reactiveEffect['options'] = options;

  return reactiveEffect;
}

export function track(trackType: TrackType, target: Object, key: string) {
  console.log(trackType == TrackType.GET);
  const reactiveEffect = effectStack[effectStack.length - 1];

  if (!reactiveEffect) return; // 肯定不是在effect中使用的，如果在这个函数一定不为空

  if (!depCache.has(target)) {
    depCache.set(target, new Map<string, Set<Effect>>());
  }

  const deps = depCache.get(target)!;

  if (!deps.has(key)) {
    deps.set(key, new Set<Effect>());
  }

  const effects = deps.get(key)!;

  if (!effects.has(reactiveEffect)) {
    effects.add(reactiveEffect);
  }
}

export function trigger(
  triggerType: TriggerType,
  target: Object,
  key: string,
  newVal: unknown,
  oldVal?: unknown
) {
  console.log('oldVal', oldVal);
  if (!depCache.has(target)) return;

  const execEffects = new Set<Effect>();
  const deps = depCache.get(target)!;

  switch (triggerType) {
    case TriggerType.ADD: {
      if (isArray(target)) {
        isInteger(key) &&
          deps.get('length')!.forEach((effect) => execEffects.add(effect));
      }

      break;
    }
    case TriggerType.SET: {
      if (isArray(target)) {
        if (key == 'length') {
          deps.get('length')!.forEach((effect) => execEffects.add(effect));

          for (const [key, effects] of deps) {
            if (isInteger(key) && key > (newVal as string)) {
              effects.forEach((effect) => execEffects.add(effect));
            }
          }
        }
      } else {
        deps.get(key)!.forEach((effect) => execEffects.add(effect));
      }

      break;
    }
  }

  execEffects.forEach((effect) => effect());
}

export function effect(fn: Function, options: any = {}) {
  const reactiveEffect = createReactiveEffect(fn, options);

  if (!options.lazy) {
    reactiveEffect();
  }

  return reactiveEffect;
}
