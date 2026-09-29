import { App, TFile } from 'obsidian';
import { CheckboxStatsSettings, DEFAULT_SETTINGS } from './settings';
import { computeStats, parseStateNames, statsEqual } from './stats';

/** Wait for edits to settle before writing to the note. */
const UPDATE_DELAY_MS = 1000;

export class CheckboxStatsUpdater {
	private timers = new Map<string, number>();

	constructor(
		private app: App,
		private getSettings: () => CheckboxStatsSettings,
	) {}

	/** Debounces an update for a note whose metadata has changed. */
	schedule(file: TFile): void {
		const pending = this.timers.get(file.path);
		if (pending !== undefined) window.clearTimeout(pending);

		const path = file.path;
		this.timers.set(
			path,
			window.setTimeout(() => {
				this.timers.delete(path);
				void this.update(file);
			}, UPDATE_DELAY_MS),
		);
	}

	cancelAll(): void {
		for (const timer of this.timers.values()) window.clearTimeout(timer);
		this.timers.clear();
	}

	/**
	 * Writes the checkbox stats property for a note if it is out of date.
	 * Notes without checkboxes are left untouched unless they already have the property.
	 * Returns whether the note was modified.
	 */
	async update(file: TFile): Promise<boolean> {
		// The note may have been deleted while an update was pending.
		if (!(this.app.vault.getAbstractFileByPath(file.path) instanceof TFile)) {
			return false;
		}

		const settings = this.getSettings();
		const { stateNames, removeWhenEmpty } = settings;
		const propertyName =
			settings.propertyName.trim() || DEFAULT_SETTINGS.propertyName;
		const cache = this.app.metadataCache.getFileCache(file);
		const stats = computeStats(
			cache,
			parseStateNames(stateNames),
			settings.unknownStateName.trim(),
		);
		const existing: unknown = cache?.frontmatter?.[propertyName];

		if (stats.total === 0) {
			if (existing === undefined) return false;
			if (removeWhenEmpty) {
				await this.app.fileManager.processFrontMatter(
					file,
					(frontmatter: Record<string, unknown>) => {
						delete frontmatter[propertyName];
					},
				);
				return true;
			}
		}

		// Our own write triggers another metadata change; this check stops it looping.
		if (statsEqual(stats, existing)) return false;

		await this.app.fileManager.processFrontMatter(
			file,
			(frontmatter: Record<string, unknown>) => {
				frontmatter[propertyName] = stats;
			},
		);
		return true;
	}

	/** Updates every note in the vault. Returns the number of notes modified. */
	async updateAll(): Promise<number> {
		let updated = 0;
		for (const file of this.app.vault.getMarkdownFiles()) {
			if (await this.update(file)) updated++;
		}
		return updated;
	}
}
