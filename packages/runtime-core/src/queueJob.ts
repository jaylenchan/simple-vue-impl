import { ReactiveEffect } from '@vue3/reactivity';


// 是否正在刷新中：默认是否
let isFlushPending = false
const resolve = Promise.resolve()
let jobQueue: ReactiveEffect[] = []

function flushJobs() {
  // 清空的时候，还需要根据调用的顺序依次的刷新：顺序是先刷新父亲，然后刷新子（跟渲染顺序一样：先父后子）
  // id小说明创出来早，所以正确的任务队列顺序应该是升序才对。比较器：a.id - b.id
  jobQueue.sort((a, b) => a.id - b.id)

  for (const job of jobQueue) {
    job()
  }

  // 任务执行，然后清空，同时重置刷新态
  isFlushPending = false
  // 执行完毕后，队列清空
  jobQueue = []
}

function queueFlush() {
  if (!isFlushPending) {
    // 逻辑这么设计，当queueJob执行的时候，就只有第一次的queueJob执行会导致逻辑进入这里
    // 接下来其余的都不会进入，这么设计，可以防止如下场景：
    /**
     * 数据多次触发视图render effect更新：
     * state.name = 'jaylen'
     * state.name = 'jay'
     * state.name = 'jaylenchan'
     * 
     * 每次state.name修改值，触发trigger，此时trigger重新拿出代表render函数的reactiveEffect，由于走调度器scheduler，
     * 调度器设置的值是queueJob，也就是queueJob会多次执行起来，这里就是执行三次。如果不对这种场景进行限制，视图的刷新会十分高频。
     * 假如有一次性连续设置一百次，视图刷新就要来一百次，调100次queueJob，会导致dom大量时间刷新，是一种很大的负担的。
     * 因此，为了解决这样的一个问题，我们引入了queueFlush这个地方的设计:
     * 当且仅当queueJob所有操作完成后，在当轮循环的末尾，清空微任务：也就是resolve.then(flushJobs)，拿出来执行，紧接着视图重新渲染
     */
    isFlushPending = true
    resolve.then(flushJobs)
  }
}

// 这个queueJob其实就是effect函数的配置项中的scheduler。当effect配置了scheduler，就会走用户指定的自定义逻辑。不过这个scheduler本身还会接收原来的effect作为参数
export function queueJob(job: ReactiveEffect) {
  // 这里对job去重了
  /**
   * 比如
   * state.name = 'jaylen'
   * state.name = 'jay'
   * state.name = 'jaylenchan'
   * 三次设置state都会导致render 对应的reactiveEffect job启动三次，但是由于这里的jobQueue做了去重，最终就只有一个在jobQueue
   * 此时数据已经更新完毕，只是视图渲染被延后了。如果不这么做，其实就算是延后视图刷新，也是会将jobQueue三个render job拿出来执行，视图一样刷新三次
   * 所以，这里的设计策略只是：让数据更改跟视图的更改时间分割，数据可以立马改变，但是视图只认一次，最终视图刷新看到的自然是最新的设置数据。
   * 总结：这里的策略就是将视图的多次触发动作，减少成了一次。因为这三次状态更改对应的是同一个render reactiveEffect，只需要一次就好。
   */
  if (!jobQueue.includes(job)) {
    jobQueue.push(job)
    queueFlush()
  }
}