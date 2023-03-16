// 对于class，使用都是<btn class="btn" />,class是一个字符串，所以假如没有，class自动为空字符串''
/**
 * 1. 增：`之前<btn class="" />  | 之后 <btn  class="btn"/>`
 * 2. 删：`之前<btn class="btn"/> | 之后 <btn class=""/>`
 * 3. 改：`之前<btn class="btn"> | 之后 <btn class="btn primary"/>`
 * - 对于三种情况，不需要区分增、删、改，可以统一成直接给class赋新值，
 */
export const patchClass = (el: Element, className: string | null) => {
  if (className == null) {
    className = ''
  }

  el.className = className
}