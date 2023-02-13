import fs from 'fs';
import path from 'path';
import execa from 'execa';
import remove from 'rimraf';

export function commandParams() {
  const argv = process.argv.slice(2);
  const params = {};

  while (argv.length > 0) {
    const key = argv.shift().slice(2);
    const val = argv.shift();

    params[key] = val;
  }

  return params;
}

export async function findModules() {
  const packagesDir = path.resolve(path.dirname('..'), 'packages');
  const modules = fs.readdirSync(packagesDir);

  return modules.map((module) => path.resolve(packagesDir, module));
}

export async function findModule(moduleName) {
  const modules = await findModules();
  const modulesMap = modules.reduce((map, module) => {
    map[path.basename(module)] = module;
    return map;
  }, {});

  return modulesMap[moduleName];
}

export async function clearOldDist(modules) {
  const tasks = [];

  for (const module of modules) {
    const task = remove(path.resolve(module, 'dist'));
    tasks.push(task);
  }

  await Promise.all(tasks);
}

export async function build(module) {
  await execa('rollup', ['-c', '--environment', `MODULE:${module}`]);
}
