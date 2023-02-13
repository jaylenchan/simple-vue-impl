import { findModule, clearOldDist, build, commandParams } from './util.js';

const moduleName = commandParams()['module'];

async function main() {
  const module = await findModule(moduleName);

  await clearOldDist([module]);
  await build(module);
}

main();
