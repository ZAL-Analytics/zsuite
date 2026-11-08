export type FolderId = string | number;
export type PickerPlace = { value: string; label: string };
export type PickerFolder = { id: FolderId; name: string };
export type PickerFile = { id: FolderId; name: string; detail?: string };

export type PickerListing<F extends PickerFile = PickerFile> = {
	folder: PickerFolder | null;
	trail: PickerFolder[];
	folders: PickerFolder[];
	files: F[];
	canPick: boolean;
};

export type PickerLabels = {
	breadcrumb: string;
	empty: string;
	loading: string;
	pickFolder: string;
	close: string;
	open: (name: string) => string;
	pick: (name: string) => string;
};
