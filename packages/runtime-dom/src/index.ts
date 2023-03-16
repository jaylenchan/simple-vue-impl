import { createRenderer } from '@vue3/runtime-core';
import { nodeOps } from './nodeOps/index';
import { patchProp } from './patchProp/index';
import { merge } from '@vue3/shared';



const rendererOptions = merge({ patchProp }, nodeOps)

// runtime-dom 调用的是 runtime-core

export function createApp(rootComponent: Record<string, unknown>, rootProps: Record<string, unknown>) {
  const app = createRenderer(rendererOptions).createApp(rootComponent, rootProps)
  const { mount } = app

  app.mount = (containerSelector: string) => {
    const container = document.querySelector(containerSelector)
    if (container) {
      container.innerHTML = ''
    }

    mount(containerSelector)
  }

  return app
}

export * from '@vue3/runtime-core'