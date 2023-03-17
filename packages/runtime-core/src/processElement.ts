import { ShapeFlags, isObject } from '@vue3/shared';
import { VNode, createVNode } from './h';
import { RendererOptions, patch } from './renderer';

function toVNode(child: any): VNode {
  if (isObject(child)) return child

  return createVNode("Text", null, child.toString())
}

function mountChildren(children: Array<any>, el: Element, rendererOptions: RendererOptions) {

  for (const child of children) {
    const vnode = toVNode(child)
    patch(null, vnode, el, rendererOptions)
  }
}


function mountElement(vnode: VNode, container: Element, rendererOptions: RendererOptions): void {
  const { createElement, patchProp, insertElement, updateElement } = rendererOptions
  const { props, shapeFlag, type, children } = vnode
  const el = createElement(type as string)

  vnode.el = el

  if (props) {
    for (const key in props) {
      patchProp(el, key, null, props[key],)
    }
  }

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    updateElement(el, children as string)
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children as any[], el, rendererOptions)
  }

  insertElement(el, container)
}

export function processElement(n1: unknown | null, vnode: VNode, container: Element, rendererOptions: RendererOptions): void {
  if (n1 == null) {
    mountElement(vnode, container, rendererOptions)
  }
}