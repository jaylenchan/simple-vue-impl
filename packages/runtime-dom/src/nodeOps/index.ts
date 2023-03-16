export const nodeOps = {
  createElement(tag: string): Element {
    return document.createElement(tag)
  },
  removeElement(child: Element): void {
    const parent = child.parentElement

    parent?.removeChild(child)
  },
  insertElement(child: Element, parent: Element, anchor?: Element): void {
    parent.insertBefore(child, anchor ?? null)
  },
  queryElement(selector: string): Element | null {
    return document.querySelector(selector)
  },
  updateElement(el: Element, text: string): void {
    el.textContent = text
  },
  createTextNode(text: string): Text {
    return document.createTextNode(text)
  },
  updateTextNode(node: Text, text: string): void {
    node.nodeValue = text
  }
}