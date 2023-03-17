import { effect } from '@vue3/reactivity'
import { ComponentInstance, createComponentInstance, setupComponent } from './component'
import { VNode } from './h'
import { RendererOptions, patch } from './renderer'
import { queueJob } from './queueJob'

// 实际调用组件的render方法了
function setupRenderEffect(componentInstance: ComponentInstance, container: Element, rendererOptions: RendererOptions) {
  // 每个组件都有一个effect，vue3是组件级更新
  componentInstance.update = effect(function componentEffect() {
    if (!componentInstance.isMounted) {
      // 初次渲染
      // 底下代码调用后拿到VNode：subTree = () => h('div', 'hello world')
      const subTree = componentInstance.render?.call(componentInstance.proxy!, componentInstance.proxy!)!
      componentInstance.subTree = subTree

      // 用组件render函数的返回值，继续进行patch渲染
      patch(null, subTree, container, rendererOptions)

      componentInstance.isMounted = true
    } else {
      // 更新渲染
      console.log("Trigger Update ddddd")
    }
  }, {
    scheduler: queueJob
  })
}

function mountComponent(vnode: VNode, container: Element, rendererOptions: RendererOptions): void {
  // 1. 先创建组件实例componentInstance
  const componentInstance = createComponentInstance(vnode)
  vnode.component = componentInstance

  // 2.componentInstance将vnode当中自己需要的数据捡到自己身上以及做一些组件准备工作（setup函数调用等）
  setupComponent(componentInstance)

  // 3.
  setupRenderEffect(componentInstance, container, rendererOptions)
}

export function processComponent(n1: unknown | null, vnode: VNode, container: Element, rendererOptions: RendererOptions): void {
  if (n1 == null) {
    // 新增节点
    mountComponent(vnode, container, rendererOptions)
  } else {
    // 更新节点
    console.log("Trigger Update")
  }
}