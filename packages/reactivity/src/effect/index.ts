import { isArray, isInteger } from '@vue3/shared';
import { TrackType, TriggerType } from '../operators';

type EffectOptions = { lazy?: boolean; scheduler?: Function };

export interface ReactiveEffect {
  (...args: unknown[]): void;
  id: number;
  _isEffect: boolean;
  raw: Function;
  options: { lazy?: boolean; scheduler?: Function };
}


/**
 * 使用栈是为了保证依赖收集时拿到正确的activeEffect，防止两个嵌套effect的情况出现
 * effect(() => {
 *   state.name = '1'
 *   effect(() => {
 *     state.age  = 1
 *   })
 *   state.class = '2' //这里假如不用栈，直接使用单纯的变量activeEffect，则会错误拿到第二个effect作为activeEffect，因为只用单纯的一个 变量没有回退操作
 * })
 */

const depCache = new WeakMap<Object, Map<string, Set<ReactiveEffect>>>();

// trigger的作用：重新调用key对应的reactiveEffect
export function trigger(
  target: Object,
  triggerType: TriggerType,
  key: string,
  newVal?: unknown,
  _oldVal?: unknown
) {
  const deps = depCache.get(target);

  if (!deps) return;

  // 存储所有需要重新执行的reactiveEffect
  const execReactiveEffects = new Set<ReactiveEffect>();

  // 数组最特殊，特殊处理length，就算length没在effect中用，但是如果effect有跟length相关的操作，length的改变也会影响到effect中的操作
  // 比如effect(() => a.innerHTML = attr) ,外部写attr.length = 0，则这个length直接影响到了attr的渲染 
  if (isArray(target) && key === 'length') {
    // 遍历数组的所有依赖集合
    deps.forEach(((reactiveEffects, key) => {
      /**
       * effect(() => { 
       *   attr[2] + attr.length
       * })
       * 此时依赖收集后，attr对应的key-sets如下
       * {
       *   2: setA
       *   length: setB
       * }
       * 则如果key >= newLength ，符合这种条件的场景是：此时正调用attr.length = 1这种操作,newLength就是1，此时2是key，比这个1大，说明数组长度收缩了
       * 意思就是说如果数组更改的新长度小于收集的索引，也要对这个索引相关的reactiveEffect进行重新执行，只有重新执行再次取值才会出现undefined 
       * 即这个if就是操作length可能出现的情况
       */
      const newLength = newVal as number

      if (key === 'length' || +key >= newLength) {
        reactiveEffects.forEach((effect) => {
          // 这里对effect去重了，像上面2和length中都有一样的reactiveEffect，会去重
          // 即同一个effect中的多个依赖变量，在trigger重新执行reactiveEffect的时候，只会拿一个reactiveEffect去执行，不会重复执行
          // 比如上面的effect的情况就是
          execReactiveEffects.add(effect)
        })
      } else {
        // 对象的情况，直接从deps取出对应key的reactiveEffects加入到执行集合中
        if (key != void 0) {
          const reactiveEffects = deps.get(key)!

          reactiveEffects.forEach(effect => {
            execReactiveEffects.add(effect)
          })
        }

        switch (triggerType) {
          case TriggerType.ADD: {

            if (!isArray(target)) {

            } else if (isInteger(key)) {
              const lengthReactiveEffects = deps.get(length.toString())!
              lengthReactiveEffects.forEach(effect => execReactiveEffects.add(effect))
            }

            break;
          }
        }
      }
    }))
  }

  execReactiveEffects.forEach(reactiveEffect => {
    if (reactiveEffect.options.scheduler) {
      reactiveEffect.options.scheduler()
    } else {
      reactiveEffect()
    }
  })
}


const effectStack: ReactiveEffect[] = [];
let activeEffect: ReactiveEffect;

// track的作用：让用户在effect自定义函数中使用的对象属性跟自定义函数本身进行关联
export function track(target: Object, trackType: TrackType, key: string) {
  if (!(trackType == TrackType.GET)) return;

  if (!activeEffect) return; // 注意：只要是响应式可变对象，就一定会出现收集依赖调用track函数，但是可能这个对象并没有在effect中自定义函数去使用， activeEffect的赋值是在effect被调用的时候赋值的，如果没有在effect中用，自然而然activeEffect是可能为空的

  // 如果依赖缓存并没有target对象的相关依赖，说明压根没收集过依赖
  // 创建出一份属于该target的缓存依赖表
  if (!depCache.has(target)) {
    depCache.set(target, new Map<string, Set<ReactiveEffect>>());
  }

  // 获取对象target的缓存依赖表
  const deps = depCache.get(target)!;

  // 尝试获取当前进行依赖收集的key对应的依赖是否存在
  // 如果当前正在进行依赖收集的key并没有相关依赖，那么创建出一份依赖集合用于依赖的收集
  if (!deps.has(key)) {
    deps.set(key, new Set<ReactiveEffect>());
  }

  // 将key对应的依赖集合取出
  const effects = deps.get(key)!;

  // 如果当前的依赖activeEffect并没有被收集过，那么将该依赖activeEffect收集到依赖集合当中
  if (!effects.has(activeEffect)) {
    effects.add(activeEffect);
  }
}

let uid = 0;

function createReactiveEffect(fn: Function, options: EffectOptions = {}) {
  const reactiveEffect: ReactiveEffect = () => {
    /**
     * 这里的if判断是为了防止以下情况
     * effect(() => { state.count++ })
     * 状态count一开始执行收集依赖，状态改变后，又重新执行了函数，又继续进行收集依赖，不断循环，造成了死循环
     * 正确的方式应该是，effectStack有这个reactiveEffect，尝试再次加入直接绕过
     */
    if (!effectStack.includes(reactiveEffect)) {
      try {
        // 在用户fn被调用之前，依赖收集还没开始，此时应该保存当前执行的reactiveEffect
        activeEffect = reactiveEffect
        // 每次执行自定义函数fn之前，都将当前活跃的activeEffect推入栈
        effectStack.push(reactiveEffect);
        // 用户自定义的fn被调用，执行fn的时候，由于内部常常会跟着使用代理取值，因此又会接着触发代理的getter,这时候如果是非readonly代理，就开始收集相关依赖了 。
        // @file-path packages/reactivity/src/reactive/baseHandlers.ts
        return fn();
      } finally {
        // 为了防止使用出错，导致出栈操作不进行，所以try finally，无论如何最终都会pop出栈顶的reactiveEffect 
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  };

  reactiveEffect['id'] = uid++; // effect唯一标识
  reactiveEffect['_isEffect'] = true; // 表示本函数是一个reactiveEffect函数
  reactiveEffect['raw'] = fn; // reactiveEffectt对应的原函数
  reactiveEffect['options'] = options; // 用户指定effect API的options

  return reactiveEffect;
}

export function effect(fn: Function, options: EffectOptions = {}) {
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

/**
 * 1. effect调用时，会首先创建一个响应式函数： reactiveEffect，利用这个函数就可以做到数据变化后，重新执行
 * 2. 对effect这个API，还能够接收第二个参数，利用这个参数进行effect行为的配置
 * 3. 对外暴露的effect API实际作用就是创建一个reactiveEffect函数，并尝试判断如果是非lazy的话立即调用一次。而用户书写的函数定义会被放入这个reactiveEffect函数被包裹一层。调用reactiveEffect就会调用用户定义的函数。
 */