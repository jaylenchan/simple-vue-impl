import { isPlainObject } from '@vue3/shared';
import { ShapeFlags, isString, isObject, isArray } from '@vue3/shared'

export interface VNode {
  _isVNode: true,
  type: string | Record<string, unknown>,
  props: Record<string, unknown> | null,
  children: any[] | null,
  key: string,
  shapeFlag: number,
  el: HTMLElement | null
  component: unknown | null
}

export type VNodeType = string | Record<string, unknown>

export function isVNode(vnode: any): boolean {
  return !!vnode._isVNode
}

function normalizeChildren(vnode: VNode, children: any[] | null) {
  let type = 0

  if (!children) {

  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else {
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.shapeFlag |= type

}

/**
 * 根据vnodeType创建出对应的Vnode，其中vnodeType可以是字符串或者是一个组件component，他们都会被挂到vnode的type上。
 * 所以vnode.type得可能值是字符串或者组件
 */
export function createVNode(vnodeType: VNodeType, props: Record<string, unknown> | null, children: any[] | null = null) {
  const shapeFlag = isString(vnodeType) ? ShapeFlags.ELEMENT : isObject(vnodeType) ? ShapeFlags.STATEFUL_COMPONENT : 0

  const vnode: VNode = {
    _isVNode: true,
    type: vnodeType,
    props,
    children,
    key: props?.key as string ?? '',
    shapeFlag, // 可以判断出vnode自身的类型和儿子的类型
    el: null,
    component: null
  }

  normalizeChildren(vnode, children)

  return vnode
}

export function h(vnodeType: VNodeType, propsOrChildren: any, children?: any[] | null) {
  const argsLength = arguments.length
  // chilren要么是字符串要么是数组
  if (argsLength == 2) {
    // propsOrChidlren是否是普通对象（即{}这种形式的对象）
    if (isPlainObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // 如果propsOrChildren是vnode，需要转化成数组的形式传递到createVNode，因为它只接受第三个参数是数组或者字符串
        return createVNode(vnodeType, null, [propsOrChildren])
      } else {
        // 如果不是vnode，这个对象一定就是props
        /**
         * 即：h(App, { name: 'jaylen' })这么使用的
         */
        return createVNode(vnodeType, propsOrChildren, null)
      }
    } else {
      // 第二个参数不是普通对象，就一定是孩子（可能是字符串、数组）
      return createVNode(vnodeType, null, propsOrChildren)
    }
  } else {
    if (argsLength > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (argsLength == 3 && isVNode(children)) {
      children = [children]
    }

    return createVNode(vnodeType, propsOrChildren, children)
  }
}