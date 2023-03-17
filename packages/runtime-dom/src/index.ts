import { createRenderer } from '@vue3/runtime-core';
import { nodeOps } from './nodeOps/index';
import { patchProp } from './patchProp/index';
import { merge } from '@vue3/shared';

// runtime-dom 调用的是 runtime-core
export * from '@vue3/runtime-core'

const rendererOptions = merge({ patchProp }, nodeOps)

export function createApp(rootComponent: Record<string, unknown>, rootProps: Record<string, unknown>) {
  const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps)
  const { _mount } = app

  app.mount = (containerSelector: string): void => {
    const container = document.querySelector(containerSelector)
    if (container) {
      container.innerHTML = ''
      _mount(container)
    }
  }

  return app
}

