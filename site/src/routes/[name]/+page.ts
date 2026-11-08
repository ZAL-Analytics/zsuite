import { error } from "@sveltejs/kit";
import { demoOf, demos } from "$lib/demos";
import type { EntryGenerator, PageLoad } from "./$types";

export const entries: EntryGenerator = () => demos.map(({ name }) => ({ name }));

export const load: PageLoad = ({ params }) => {
  if (!demoOf(params.name)) error(404, "No such component");
  return { name: params.name };
};
