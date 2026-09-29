export interface CheckboxStatsSettings {
	/** Frontmatter property the stats are written to. */
	propertyName: string;
	/** State name definitions, one per line, e.g. `[x] done`. */
	stateNames: string;
	/** Remove the property instead of zeroing it when a note has no checkboxes left. */
	removeWhenEmpty: boolean;
}

export const DEFAULT_SETTINGS: CheckboxStatsSettings = {
	propertyName: 'checkboxes',
	stateNames: '[ ] todo\n[x] done\n[X] done',
	removeWhenEmpty: false,
};
