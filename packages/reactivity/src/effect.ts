import { isArray, isInteger } from './../../shared/src/index';
import { TrackType, TriggerType } from './operators';
type Effect = (...args: unknown[]) => void;

let uid = 0;
const effectStack: Effect[] = [];
const depCache = new WeakMap<Object, Map<string, Set<Effect>>>();

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

  // #根据触发类型，将相关的effect添加到effect触发集合中，待会一次性全部拿出执行
  switch (triggerType) {
    case TriggerType.ADD: {
      if (isArray(target)) {
        // #添加了一个>=数组长度的索引，则长度的相关effect也需要被添加触发
        if (isInteger(key)) {
          deps.get('length')?.forEach((effect) => execEffects.add(effect));
        }
      }

      break;
    }
    case TriggerType.SET: {
      if (isArray(target)) {
        switch (key) {
          // #修改数组的length
          case 'length': {
            const newLen = newVal as string;
            for (const [key, effects] of deps) {
              if (key === 'length' || key >= newLen) {
                effects.forEach((effect) => execEffects.add(effect));
              }
            }

            break;
          }
          default: {
            deps.get(key)?.forEach((effect) => execEffects.add(effect));
          }
        }
      } else {
        deps.get(key)?.forEach((effect) => execEffects.add(effect));
      }

      break;
    }
  }

  // #将需要执行的effect一个个拿出来执行
  execEffects.forEach((effect) => effect());
}

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

  reactiveEffect['id'] = uid++; // effect唯一标识
  reactiveEffect['_isEffect'] = true; // 表示本函数是一个effect
  reactiveEffect['raw'] = fn; // effect对应的原函数
  reactiveEffect['options'] = options; // 用户指定effect的options

  return reactiveEffect;
}

export function effect(fn: Function, options: any = {}) {
  const reactiveEffect = createReactiveEffect(fn, options);

  // 默认会先执行一次转换成响应式后的effect（即无lazy属性默认情况下，这时候会先执行一次）
  if (!options.lazy) {
    reactiveEffect();
  }

  return reactiveEffect;
}

/**
 * 1. effect为基础包装的函数都要跟reactive几个api结合使用才有效果，否则只是单纯的自定义对象，没经过reactive，是不会收集依赖的，执行赋值操作自然也不会进行视图相关更新。
 * 2. effectStack保存effect的原因是，effect嵌套使用，单用一个全局变量记录当前活动的effect，track收集依赖需要当前track的key找对应的effect时很可能出错，但是如果换成取栈顶元素一定不会出错，因为执行完内层，会弹出相关effect
 * 3. 在effect中使用到的属性会track收集effect，更改属性的时候，如果是在effect中出现的属性会trigger让effect重新执行
 */
