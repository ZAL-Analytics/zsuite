export type Dropped = { path: string[]; file: File };
export type DropContent = { keys: string[]; files: Dropped[] };

export const INTERNAL = "application/x-zsuite-items";

function fileOf(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

function batch(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
}

function isFolder(entry: FileSystemEntry | null): entry is FileSystemDirectoryEntry {
  return entry !== null && entry.isDirectory;
}

function isFile(entry: FileSystemEntry): entry is FileSystemFileEntry {
  return entry.isFile;
}

async function walk(folder: FileSystemDirectoryEntry, path: string[], found: Dropped[]): Promise<void> {
  const inside = [...path, folder.name];
  const reader = folder.createReader();
  for (let entries = await batch(reader).catch(() => []); entries.length > 0; entries = await batch(reader).catch(() => [])) {
    for (const child of entries) {
      if (isFolder(child)) await walk(child, inside, found);
      else if (isFile(child)) {
        const file = await fileOf(child).catch(() => null);
        if (file) found.push({ path: inside, file });
      }
    }
  }
}

export async function droppedFiles(transfer: DataTransfer): Promise<Dropped[]> {
  const files = [...transfer.files];
  const folders = [...transfer.items].map((item) => (item.kind === "file" ? item.webkitGetAsEntry() : null)).filter(isFolder);
  const names = new Set(folders.map((folder) => folder.name));
  const found: Dropped[] = files.filter((file) => !names.has(file.name)).map((file) => ({ path: [], file }));
  for (const folder of folders) await walk(folder, [], found);
  return found;
}

export function pickedFiles(files: FileList): Dropped[] {
  return [...files].map((file) => ({ path: file.webkitRelativePath.split("/").slice(0, -1).filter(Boolean), file }));
}

export function foldersToMake(dropped: Dropped[]): string[][] {
  const seen = new Map<string, string[]>();
  for (const { path } of dropped) {
    for (let depth = 1; depth <= path.length; depth++) seen.set(path.slice(0, depth).join("/"), path.slice(0, depth));
  }
  return [...seen.values()].sort((a, b) => a.length - b.length);
}

export function hasFiles(transfer: DataTransfer | null): boolean {
  return transfer !== null && [...transfer.types].includes("Files");
}

export function keysOf(text: string): string[] {
  try {
    const value: unknown = JSON.parse(text);
    return Array.isArray(value) ? value.filter((key): key is string => typeof key === "string") : [];
  } catch {
    return [];
  }
}

export async function dropContent(transfer: DataTransfer | null): Promise<DropContent> {
  const internal = transfer?.getData(INTERNAL) ?? "";
  if (internal) return { keys: keysOf(internal), files: [] };
  if (transfer && hasFiles(transfer)) return { keys: [], files: await droppedFiles(transfer) };
  return { keys: [], files: [] };
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("moved items come as a list of keys, anything else as nothing", () => {
    expect(keysOf('["folder-1","document-2"]')).toEqual(["folder-1", "document-2"]);
    expect(keysOf("not json")).toEqual([]);
    expect(keysOf('{"a":1}')).toEqual([]);
  });

  test("folders from a drop are made parents first, each once", () => {
    const file = new File(["x"], "a.txt");
    const dropped = [
      { path: ["Project", "Tekeningen"], file },
      { path: ["Project"], file },
      { path: [], file },
      { path: ["Project", "Tekeningen", "Oud"], file },
    ];
    expect(foldersToMake(dropped)).toEqual([["Project"], ["Project", "Tekeningen"], ["Project", "Tekeningen", "Oud"]]);
  });
}
