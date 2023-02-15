import { findModules, clearOldDist } from './util.js';

async function main() {
  const modules = await findModules();

  await clearOldDist(modules);
}

main();
