import { TrackType, TriggerType } from '../operators';
import { hasOwn, hasChanged, isArray, isInteger } from '@vue/shared';
import { track, trigger } from '../effect';
import { readonly as Readonly, reactive } from '..';

function createGetter(readonly: boolean, shallow: boolean) {
  return (target:object, key:string, receiver:object) => {
    const value = Reflect.get(target,key, receiver)

    // 如果不是只读的，需要收集依赖
    if(!readonly) {
      // 收集依赖：指的是effect”用户自定义函数“跟”用户自定义函数调用的时候，响应式代理内部target使用到的key“产生关联。
      // 实际上，真正跟key关联的是effect函数创建出来的reactiveEffect函数
      track( target,TrackType.GET, key)
    }

    // 如果是浅代理， 到这里直接返回值
    if(shallow) {
      return value
    }

    // 否则，判断是只读的，继续对值只读代理，否则继续对值可变代理
    return readonly ? Readonly(value) : reactive(value)
  }
}

function createSetter(_shallow: boolean) {
  // setter做两件事：设置值 + 视图重刷新
  return (target: Object, key: string, newVal: unknown, receiver: unknown) => {
    const flag = Reflect.set(target, key, newVal, receiver);

    // NOTE:如何判断一个属性是新增还是修改：方式就是拿这个属性到对象那边查一下，有这个属性此时触发setter就是修改操作，否则就是新增操作咯: const oldValue = target[key]
    // 第一步：判断本次setter操作是新增操作还是修改操作
    // 对于修改操作，只拿数组合法范围的key进行判断，对于对象，直接判断target有没有该key
    const hadKey = isArray(target) && isInteger(key) ? +key < target.length : hasOwn(target,key)
    const oldVal = target[key as keyof typeof target]
    if(!hadKey) {
      // 新增
      trigger(target,TriggerType.ADD,key,newVal)
    }else {
      // 修改
      // 修改的场景下，只有新值跟旧值不同的情况下，才进行视图触发更新，即重新调用key对应的reactiveEffect
      if(hasChanged(oldVal, newVal)) {
        trigger(target,TriggerType.SET,key, newVal,oldVal)
      }
    } 

    return flag;
  };
}

const shallowReactiveGetter = createGetter(false, true);
const reactiveGetter = createGetter(false, false);
const shallowReadonlyGetter = createGetter(true, true);
const readonlyGetter = createGetter(true, false);

const shallowReactiveSetter = createSetter(true);
const reactiveSetter = createSetter(false);
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
