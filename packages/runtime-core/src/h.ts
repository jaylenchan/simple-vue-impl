import { isPlainObject } from '@vue3/shared';
import { VNodeType, createVNode, isVNode } from './vnode';

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