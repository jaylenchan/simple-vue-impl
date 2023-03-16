import { Render } from './renderer'
import { createVNode } from './vnode'


export function createAppAPI(render: Render) {
  return (rootComponent: Record<string, unknown>, rootProps: Record<string, unknown>) => {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null as unknown as string,
      mount(container: string) {
        //  create VNode
        const vnode = createVNode(rootComponent, rootProps)
        render(vnode, container)

        app._container = container
      }
    }

    return app
  }
}