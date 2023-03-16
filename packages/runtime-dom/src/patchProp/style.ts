/**
 * 以新值newStyleConfig为标准出发,判断大情况两种，newStyleConfig为空删除style属性 | newStyleConfig不为空不删除style属性
 * 1. newStyleConfig为空，说明需要删除style属性：之前是`<btn style={{ color: "red" }}/>` ,之后是`<btn/>`，此时newStyleConfig == null，需要删除style
 * 2. newStyleConfig不为空，说明不删除style属性，但需要修改里头的内容：
 *    - 2.1 删除oldStyleConfig有，newStyleConfig没有的：style属性删除一个key-val，之前是`<btn style={{ color: "red", fontSize: '10px' }}/>`,之后是`<btn style={{ color: "red" }}/>`
 *          这种情况的话，需要判断oldStyleConfig中哪个key在newStyleConfig中没有，没有的，对style上这个key操作style[key] = ''
 *    - 2.2 将newStyleConfig所有key放到style上赋值
 */
export const patchStyle = (el: HTMLElement, oldStyleConfig: CSSStyleDeclaration, newStyleConfig: CSSStyleDeclaration) => {
  const style = el.style

  if (newStyleConfig == null) {
    el.removeAttribute('style')
  } else {
    /**
       * 站在oldStyleConfig角度：比对newStyleConfig比oldStyleConfig缺少了哪些key，删除这些key，style[key] = ''
       */
    if (oldStyleConfig) {
      for (let key in oldStyleConfig) {
        if (newStyleConfig[key] == null) {
          style[key] = ''
        }
      }
    }

    /**
     * 站在newStyleConfig角度：将newStyleConfig所有key放到style上赋值
     */
    for (const key in newStyleConfig) {
      style[key] = newStyleConfig[key]
    }

  }
}