import { ShapeFlags } from '@vue3/shared';
import { VNode } from './vnode';
import { ComponentInstance, createComponentInstance, setupComponent } from './component';
import { effect } from '@vue3/reactivity';
import { h } from './h';

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

// 实际调用组件的render方法了
const setupRenderEffect = (componentInstance: ComponentInstance, container: Element) => {
  // 每个组件都有一个effect，vue3是组件级更新
  componentInstance.update = effect(function componentEffect() {
    if (!componentInstance.isMounted) {
      // 初次渲染
      // 底下代码调用后拿到VNode：subTree = () => h('div', 'hello world')
      const subTree = componentInstance.render?.call(componentInstance.proxy!, componentInstance.proxy!)!

      componentInstance.subTree = subTree

      patch(null, subTree, container)

      componentInstance.isMounted = true
    } else {
      // 更新渲染
    }
  })
}

const mountComponent = (vnode: VNode, container: Element) => {
  // 1. 先创建组件实例componentInstance
  const componentInstance = createComponentInstance(vnode)
  vnode.component = componentInstance

  // 2.componentInstance将vnode当中自己需要的数据捡到自己身上以及做一些组件准备工作（setup函数调用等）
  setupComponent(componentInstance)

  // 3.
  setupRenderEffect(componentInstance, container)
}

const processComponent = (n1: unknown | null, vnode: VNode, container: Element) => {
  if (n1 == null) {
    // 新增节点
    mountComponent(vnode, container)
  } else {
    // 更新节点
  }
}

/** 
 * 拿出vnode的shapeFlag根据不同shapeFlag的vnode，创建出对应的真实节点
 */
const patch = (n1: unknown | null, vnode: VNode, container: Element) => {
  const { shapeFlag } = vnode

  if (shapeFlag & ShapeFlags.ELEMENT) {// 元素

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