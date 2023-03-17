import { isEvent } from '@vue3/shared';
import { patchStyle } from './style';
// 针对一系列的节点属性操作

import { patchClass } from './class';
import { patchEvent } from './event';
import { patchAttr } from './attr';

// 1. 之前没有，之后有 ： 增 （prevValue = null, newValue != null）
// 2. 之前有，之后没有 ： 删  (prevValue != null, newValue == null)
// 3. 之前有，之后有 ： 改  (prevValue != null, newValue != null)
// key的可能性有几种： style | class | event | attr
export const patchProp = (el: Element, key: string, prevValue: unknown, newValue: unknown) => {
  if (key == 'class') {
    patchClass(el, newValue as string)
  } else if (key == 'style') {
    patchStyle(el as HTMLElement, prevValue as CSSStyleDeclaration, newValue as CSSStyleDeclaration)
  } else {
    if (isEvent(key)) {
      // event
      patchEvent(el as HTMLElement, key, newValue as EventListener)
    } else {
      // attr
      patchAttr(el as HTMLElement, key, newValue as string)
    }
  }
}