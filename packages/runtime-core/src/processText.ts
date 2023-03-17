import { VNode } from './h';
import { RendererOptions } from './renderer';

export function processText(n1: unknown | null, vnode: VNode, container: Element, rendererOptions: RendererOptions): void {
  const { createTextNode, insertElement } = rendererOptions

  if (n1 == null) {
    const textNode = createTextNode(vnode.children as string) as unknown as Element
    insertElement(textNode, container)
  }
}