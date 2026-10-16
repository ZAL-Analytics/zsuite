export type Tree = { name: string; notebooks: { name: string; pages: string[] }[] }[];

export function moved(path: string | null, from: string, to: string) {
  if (path === from) return to;
  return path !== null && path.startsWith(`${from}/`) ? to + path.slice(from.length) : path;
}

export const pagesOf = (tree: Tree) =>
  tree.flatMap((project) =>
    project.notebooks.flatMap((notebook) => notebook.pages.map((page) => `${project.name}/${notebook.name}/${page}`)),
  );
