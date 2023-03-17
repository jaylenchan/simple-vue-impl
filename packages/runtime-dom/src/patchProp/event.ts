
function createInvoker(listener: EventListener) {
  const invoker: Invoker = (event: Event) => {
    invoker.value(event)
  }
  invoker.value = listener

  return invoker
}


/**
 * patchEvent也是对应事件的增、删、改三种情况
 * 
 * - 用invoker的原因是，遇到如下场景：
 * `<btn onClick={handleClick}/> | <btn onClick={handleClick1} />`
 * 这时候修改，只需要修改invoker.value绑定的值，不需要通过removeEventListener然后再addEventListener的方式对处理函数进行修改，包裹一层就更简单巧妙
 */
export const patchEvent = (el: HTMLElement, event: string, newListener?: EventListener) => {
  const invokerCache = el.invokerCache || {}

  const eventName = event.slice(2).toLowerCase() as keyof HTMLEvents
  const existInvoker = invokerCache[eventName]


  if (!existInvoker) {
    if (newListener) {
      // 新增一个对应event的invoker
      const invoker = createInvoker(newListener)

      invokerCache[eventName] = invoker
      el.addEventListener(eventName, invoker)
    }

  } else {
    if (newListener) {
      // 修改一个对应event绑定的invoker
      existInvoker.value = newListener

    } else {
      // 删除一个对于event的invoker
      el.removeEventListener(eventName, existInvoker)
      invokerCache[eventName] = undefined
    }
  }
}
