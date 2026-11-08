/** One step of a breadcrumb: a link (`href`), a button (`onclick`) or plain text; `current` marks the page you are on. */
export type BreadcrumbItem = { label: string; href?: string; onclick?: () => void; current?: boolean };
