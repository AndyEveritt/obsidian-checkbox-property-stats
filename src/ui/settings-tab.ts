import { PluginSettingTab, SettingDefinitionItem } from 'obsidian';
import { CheckboxStatsSettings, DEFAULT_SETTINGS } from '../settings';

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
				desc: 'One per line, such as "[>] deferred". Characters that map to the same name are counted together.',
				control: {
					type: 'textarea',
					key: 'stateNames',
					defaultValue: DEFAULT_SETTINGS.stateNames,
					placeholder: DEFAULT_SETTINGS.stateNames,
					rows: 6,
				},
			},
			{
				name: 'Unknown state name',
				desc: 'States not listed above are counted under this name. Leave empty to use the state character instead.',
				control: {
					type: 'text',
					key: 'unknownStateName',
					defaultValue: DEFAULT_SETTINGS.unknownStateName,
					placeholder: DEFAULT_SETTINGS.unknownStateName,
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
