import { isArray, isObject } from '@vue3/shared';
import { createVNode, isVNode } from './vnode';

export function h(elementType: string, propsOrChildren: any, children: any[] | string) {
  const argsLength = arguments.length
  // chilren要么是字符串要么是数组
  if (argsLength == 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(elementType, null, [propsOrChildren] as any)
      }

      return createVNode(elementType, propsOrChildren, null)
    } else {
      // 第二个参数不是对象，就一定是孩子
      return createVNode(elementType, null, propsOrChildren)
    }
  } else {
    if (argsLength > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (argsLength == 3 && isVNode(children)) {
      children = [children]
    }

    return createVNode(elementType, propsOrChildren, children)
  }
}