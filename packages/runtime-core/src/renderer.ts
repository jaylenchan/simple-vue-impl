import { ShapeFlags } from '@vue3/shared';
import { createAppAPI } from './apiCreateApp';
import { VNode } from './vnode';
import { ComponentInstance, createComponentInstance, setupComponent } from './component';
import { effect } from '@vue3/reactivity';

interface RendererOptions {
  createElement(tag: string): Element;
  removeElement(child: Element): void;
  insertElement(child: Element, parent: Element, anchor?: Element): void;
  queryElement(selector: string): Element | null;
  updateElement(el: Element, text: string): void;
  createTextNode(text: string): Text;
  updateTextNode(node: Text, text: string): void;
  patchProp(el: HTMLElement, key: string, prevValue: unknown, newValue: unknown): void
}

export type Render = (vnode: VNode, container: HTMLElement) => void

export function createRenderer(rendererOptions: RendererOptions) {

  // 实际调用组件的render方法了
  const setupRenderEffect = (componentInstance: ComponentInstance, container: HTMLElement) => {
    // 每个组件都有一个effect，vue3是组件级更新
    componentInstance.update = effect(function componentEffect() {
      if (!componentInstance.isMounted) {
        // 初次渲染
        const subTree = componentInstance.render?.call(componentInstance.proxy!, componentInstance.proxy!)!

        componentInstance.subTree = subTree

        patch(null, subTree, container)

        componentInstance.isMounted = true
      } else {
        // 更新渲染
      }
    })
  }

  const mountComponent = (vnode: VNode, container: HTMLElement) => {
    // 1. 先创建组件实例
    const componentInstance = createComponentInstance(vnode)
    vnode.component = componentInstance

    // 2.将需要的数据挂载到instance
    setupComponent(componentInstance)

    // 3.
    setupRenderEffect(componentInstance, container)
  }

  const processComponent = (n1: unknown | null, vnode: VNode, container: HTMLElement) => {

    if (n1 == null) {
      // 新增节点
      mountComponent(vnode, container)
    } else {
      // 更新节点
    }
  }

  const patch = (n1: unknown | null, vnode: VNode, container: HTMLElement) => {
    const { shapeFlag } = vnode

    if (shapeFlag & ShapeFlags.ELEMENT) {// 元素

    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) { // 组件
      processComponent(n1, vnode, container)
    }
  }

  const render = (vnode: VNode, container: HTMLElement) => {
    // 根据不同类型（ShapeFlag）的虚拟节点vnode，创建出对应的真实节点

    patch(null, vnode, container)
  }

  return {
    createApp: createAppAPI(render),
  }
}