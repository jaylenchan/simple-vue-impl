import { ShapeFlags } from '@vue3/shared';
import { h, VNode } from './h';
import { processComponent } from './processComponent';
import { processElement } from './processElement';

export type Mount = (containerSelector: string) => void

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

export type Render = (vnode: VNode, container: Element) => void

interface Renderer {
  createApp: (rootComponent: Record<string, unknown>, rootProps: Record<string, unknown>) => {
    _props: Record<string, unknown>;
    _component: Record<string, unknown>;
    _container: Element;
    _mount(container: Element): void;
    mount: Mount;
  }
}

/** 
 * 作用：拿出vnode的shapeFlag,根据不同shapeFlag判断vnode是一个元素还是组件，创建出对应的真实节点
 * 初始化和更新渲染都会用这个方法
 */
export const patch = (n1: unknown | null, vnode: VNode, container: Element) => {
  const { shapeFlag } = vnode

  // 针对不同类型做初始化操作或更新操作
  // 根据不同shapeFlag判断vnode是一个元素还是组件
  if (shapeFlag & ShapeFlags.ELEMENT) {// 元素
    processElement()
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) { // 组件
    processComponent(n1, vnode, container)
  }
}

/**
 * 将虚拟节点转化成真实节点挂载到container上
 */
const render = (vnode: VNode, container: Element) => {
  patch(null, vnode, container)
}

export function createRenderer(rendererOptions: RendererOptions): Renderer {
  rendererOptions

  const renderer = {
    createApp: (rootComponent: Record<string, unknown>, rootProps: Record<string, unknown>) => {
      const app = {
        _props: rootProps,
        _component: rootComponent,
        _container: null as unknown as Element,
        _mount(container: Element) { // 挂载到container
          // 1.根据组件+传递给组件的props创建虚拟节点
          const vnode = h(rootComponent, rootProps)

          // 2. 将虚拟节点转化成真实节点挂载到container上
          render(vnode, container)

          app._container = container
        },
        mount: null as unknown as Mount
      }

      return app
    }
  }

  return renderer
}