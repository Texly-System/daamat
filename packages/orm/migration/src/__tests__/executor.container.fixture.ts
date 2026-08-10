export function container(modules: { dir: string; name: string }[]) {
  const result: Record<string, object> = {};
  for (const module of modules)
    result[module.name] = {
      id: module.name,
      name: module.name,
      path: module.dir,
      resolve: module.dir,
    };
  return result;
}
