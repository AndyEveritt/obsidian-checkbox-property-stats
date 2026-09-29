import { PluginSettingTab, SettingDefinitionItem } from 'obsidian';

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

/** Values are read from and saved to `plugin.settings` by `PluginSettingTab`. */
export class CheckboxStatsSettingTab extends PluginSettingTab {
	getSettingDefinitions(): SettingDefinitionItem<keyof CheckboxStatsSettings>[] {
		return [
			{
				name: 'Property name',
				desc: 'Frontmatter property to store checkbox stats in. Existing notes keep the old property if this is changed.',
				control: {
					type: 'text',
					key: 'propertyName',
					defaultValue: DEFAULT_SETTINGS.propertyName,
					placeholder: DEFAULT_SETTINGS.propertyName,
					validate: (value) =>
						value.trim() ? undefined : 'Enter a property name.',
				},
			},
			{
				name: 'State names',
				desc: 'One per line, such as "[/] in progress". Characters that map to the same name are counted together. Unlisted states use the character itself.',
				control: {
					type: 'textarea',
					key: 'stateNames',
					defaultValue: DEFAULT_SETTINGS.stateNames,
					placeholder: DEFAULT_SETTINGS.stateNames,
					rows: 6,
				},
			},
			{
				name: 'Remove property when empty',
				desc: 'Remove the property when the last checkbox is deleted from a note, instead of setting the total to zero.',
				control: {
					type: 'toggle',
					key: 'removeWhenEmpty',
					defaultValue: DEFAULT_SETTINGS.removeWhenEmpty,
				},
			},
		];
	}
}
