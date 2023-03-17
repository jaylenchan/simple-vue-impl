# Vue3-Source



## 核心模块关系图

```shell
                      +---------------------+    +----------------------+
                      |                     |    |                      |
        +------------>|  @vue3/compiler-dom  +--->|  @vue3/compiler-core|
        |             |                     |    |                      |
   +----+----+        +---------------------+    +----------------------+
   |         |
   |   vue   |
   |         |
   +----+----+        +---------------------+     +----------------------+     +--------------------+
        |             |                     |     |                      |     |                    |
        +------------>|  @vue3/runtime-dom   +--->|  @vue3/runtime-core   +--->|  @vue3/reactivity  |
                      |                     |     |                      |     |                    |
                      +---------------------+     +----------------------+     +--------------------+
```
