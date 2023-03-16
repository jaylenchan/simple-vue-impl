export const patchAttr = (el: HTMLElement, attr: string, newValue: string | null) => {
  if (newValue == null) {
    el.removeAttribute(attr)
  } else {
    el.setAttribute(attr, newValue)
  }
}