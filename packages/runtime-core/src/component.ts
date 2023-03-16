import { ShapeFlags, isString } from '@vue3/shared';
import { VNode } from './vnode';
import { componentPublicProxyHandler } from './componentPublicInstance';

export interface ComponentInstance {
  vnode: VNode,
  type: VNode["type"],
  props: Record<string, unknown> | null,
  attrs: Record<string, unknown> | null,
  slots: Record<string, unknown> | null,
  setupState: Record<string, unknown> | null, // setup 返回的对象
  isMounted: boolean,
  ctx: { _: ComponentInstance } | null,
  children: Record<string, unknown> | null,
  proxy: {
    _: ComponentInstance;
  } | null
}

export function createComponentInstance(vnode: VNode): ComponentInstance {
  // 表示组件的相关信息
  const componentInstance: ComponentInstance = {
    vnode,
    type: vnode.type,
    props: null,
    attrs: null,
    slots: null,
    setupState: null, // setup 返回的对象
    isMounted: false,
    ctx: null,
    children: null,
    proxy: null
  }

  componentInstance.ctx = { _: componentInstance }

  return componentInstance
}

function createSetupContext(componentInstance: ComponentInstance) {
  return {
    attrs: componentInstance.attrs,
    slots: componentInstance.slots,
    emit: () => { },
    expose: () => { }
  }
}

function setupStatefulComponent(componentInstance: ComponentInstance) {
  // proxy只是为了让开发者访问相关属性方便创造出来的
  const proxy = new Proxy(componentInstance.ctx as Exclude<ComponentInstance["ctx"], null>, componentPublicProxyHandler)
  const component = componentInstance.type

  componentInstance.proxy = proxy

  if (!isString(component)) {
    const { setup } = component as any
    const setupContext = createSetupContext(componentInstance)

    setup(componentInstance.props, setupContext)
  }
}

export function setupComponent(componentInstance: ComponentInstance) {
  const { props, children } = componentInstance.vnode

  componentInstance.props = props
  componentInstance.children = children

  // 判断是否是状态组件(有setup或者render)
  const isStateful = componentInstance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isStateful) {
    // 调setup，然后填充setupState
    setupStatefulComponent(componentInstance)
  }
}

