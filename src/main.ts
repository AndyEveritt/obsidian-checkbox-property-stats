import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import { CheckboxStatsSettings, DEFAULT_SETTINGS } from './settings';
import { CheckboxStatsSettingTab } from './ui/settings-tab';
import { CheckboxStatsUpdater } from './updater';

export default class CheckboxPropertyStatsPlugin extends Plugin {
	settings!: CheckboxStatsSettings;

	async onload() {
		await this.loadSettings();

		const updater = new CheckboxStatsUpdater(this.app, () => this.settings);
		this.register(() => updater.cancelAll());

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => updater.schedule(file)),
		);

		registerCommands(this, updater);
		this.addSettingTab(new CheckboxStatsSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<CheckboxStatsSettings>,
		);
	}
}
