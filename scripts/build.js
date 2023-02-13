// 找到所有需要打包的模块
// 调用rollup打包这些模块
import { findModules, clearOldDist, build } from './util.js';

function buildAll(modules) {
  const tasks = [];

  for (const module of modules) {
    const task = build(module);
    tasks.push(task);
  }

  return Promise.all(tasks);
}

async function main() {
  const modules = await findModules();

  await clearOldDist(modules);
  await buildAll(modules);
}

main();
