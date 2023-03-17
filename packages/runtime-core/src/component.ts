import { ShapeFlags, isString, isFunction, isObject } from '@vue3/shared';
import { VNode } from './vnode';
import { componentPublicProxyHandler } from './componentPublicInstance';

import type { ReactiveEffect } from '@vue3/reactivity';

export interface ComponentInstance {
  vnode: VNode,
  type: VNode["type"],
  props: Record<string, unknown> | null,
  attrs: Record<string, unknown> | null,
  slots: Record<string, unknown> | null,
  setupState: Record<string, unknown> | null, // setup 返回的对象
  isMounted: boolean,
  ctx: { _: ComponentInstance } | null,
  children: any[] | null,
  proxy: {
    _: ComponentInstance;
  } | null,
  render: ((proxy: {
    _: ComponentInstance;
  }) => VNode) | null
  update: ReactiveEffect | null
  subTree: VNode | null
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
    proxy: null,
    render: null,
    update: null,
    subTree: null
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

function finishComponentSetup(componentInstance: ComponentInstance) {
  const component = componentInstance.type as any
  if (!componentInstance.render) {
    // 没有render提供，需要对template模板进行编译，产生出render函数
    if (!component.render && component.template) {
      const compile = (template: string) => { template }
      component.render = compile(component.template)
    }
    componentInstance.render = component.render
  }
}

function handleSetupResult(componentInstance: ComponentInstance, setupResult: any) {
  if (isFunction(setupResult)) {
    // 如果是函数，这个setupResult就是render
    componentInstance.render = setupResult
  } else if (isObject(setupResult)) {
    // 如果是对象，就是setupState
    componentInstance.setupState = setupResult
  }

  finishComponentSetup(componentInstance)
}

export let currentComponentInstance: ComponentInstance | null = null

function setupStatefulComponent(componentInstance: ComponentInstance) {
  // proxy只是为了让开发者访问相关属性方便创造出来的
  const proxy = new Proxy(componentInstance.ctx as Exclude<ComponentInstance["ctx"], null>, componentPublicProxyHandler)
  const component = componentInstance.type

  componentInstance.proxy = proxy

  if (!isString(component)) {
    const { setup } = component as any

    if (setup) {
      currentComponentInstance = componentInstance

      const setupContext = createSetupContext(componentInstance)
      const setupResult = setup(componentInstance.props, setupContext)

      currentComponentInstance = null

      handleSetupResult(componentInstance, setupResult)
    } else {
      finishComponentSetup(componentInstance)
    }
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

