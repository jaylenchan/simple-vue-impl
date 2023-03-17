
import { ComponentInstance, currentComponentInstance } from './component'

export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
  DEACTIVATED = 'da',
  ACTIVATED = 'a',
  RENDER_TRIGGERED = 'rtg',
  RENDER_TRACKED = 'rtc',
  ERROR_CAPTURED = 'ec',
  SERVER_PREFETCH = 'sp'
}

function injectHook(lifecycleType: LifecycleHooks, hook: Function, target: ComponentInstance | null) {
  if (!target) {
    return console.warn(`Lifecycle injection APIs can only be used during execution of setup().`
    )
  } else {
    const hooks = target[lifecycleType as unknown as keyof typeof target] || (target[lifecycleType as unknown as keyof typeof target] = [] as any)

    hooks.push(hook)
  }
}

function createHook(lifecycleType: LifecycleHooks) {
  const lifecycleHook = (hook: Function, target = currentComponentInstance) => {
    // 给当前实例增加对应的生命周期
    injectHook(lifecycleType, hook, target)
  }
  lifecycleHook
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_CREATE)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)