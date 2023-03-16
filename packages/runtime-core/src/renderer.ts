import { ShapeFlags } from '@vue3/shared';
import { createAppAPI } from './apiCreateApp';
import { VNode } from './vnode';
import { createComponentInstance, setupComponent } from './component';

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
  
  const setupRenderEffect = (instance: unknown) => { }

  const mountComponent = (vnode: VNode, container: unknown) => {
    // 调用setup拿到返回值，获取render函数的返回结果

    // 1. 先创建组件实例
    const instance = createComponentInstance(vnode)
    vnode.component = instance

    // 2.将需要的数据挂载到instance
    setupComponent(instance)

    // 3.
    setupRenderEffect(instance)
  }

  const processComponent = (n1: unknown | null, vnode: VNode, container: unknown) => {

    if (n1 == null) {
      // 新增节点
      mountComponent(vnode, container)
    } else {
      // 更新节点
    }
  }

  const patch = (n1: unknown | null, vnode: VNode, container: unknown) => {
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