import { hasOwn } from '@vue3/shared';
import { ComponentInstance } from './component';

export const componentPublicProxyHandler = {
  get({ _: instance }: Exclude<ComponentInstance["ctx"], null>, key: string) {
    const { setupState, props } = instance

    if (hasOwn(setupState as object, key)) {
      return setupState?.[key]
    } else if (hasOwn(props as object, key)) {
      return props?.[key]
    }
  },

  set({ _: instance }: Exclude<ComponentInstance["ctx"], null>, key: string, newValue: unknown) {
    const { setupState, props } = instance

    if (setupState && hasOwn(setupState as object, key)) {
      setupState[key] = newValue
    } else if (props && hasOwn(props as object, key)) {
      props[key] = newValue
      return true
    }

    return true
  }
}