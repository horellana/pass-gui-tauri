import { invoke } from '@tauri-apps/api/tauri';

import { PassEntry } from "./types";

export async function getEntry(entryName: string): Promise<string> {
  return await invoke("get_entry", { entryName });
}

export async function editEntry(entryName: string, entryContents: string): Promise<void> {
  await invoke("edit_entry", { entryName, entryContents });
}

export async function removeEntry(entryName: string): Promise<void> {
  await invoke("remove_entry", { entryName });
}

export async function listEntries(filter: string): Promise<PassEntry[]> {
  let entries: string[] = await invoke("list_pass_entries")

  if (filter && filter.length > 0) {
    entries = entries.filter((entry) => {
      return entry.toLowerCase().match(filter.toLowerCase());
    });
  }

  return entries.map((entry: string) => {
    return {
      name: entry,
      content: undefined,
      selected: false
    }
  }).sort();

}
