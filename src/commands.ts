import { Notice, Plugin } from 'obsidian';
import { CheckboxStatsUpdater } from './updater';

export function registerCommands(plugin: Plugin, updater: CheckboxStatsUpdater) {
	plugin.addCommand({
		id: 'update-current-note',
		name: 'Update checkbox stats in current note',
		checkCallback: (checking: boolean) => {
			const file = plugin.app.workspace.getActiveFile();
			if (file?.extension !== 'md') return false;
			if (!checking) void updater.update(file);
			return true;
		},
	});

	plugin.addCommand({
		id: 'update-all-notes',
		name: 'Update checkbox stats in all notes',
		callback: async () => {
			const updated = await updater.updateAll();
			new Notice(
				`Updated checkbox stats in ${updated} note${updated === 1 ? '' : 's'}.`,
			);
		},
	});
}
