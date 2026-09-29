import { CachedMetadata } from 'obsidian';

export interface CheckboxStats {
	total: number;
	states: Record<string, number>;
}

/**
 * Parses state name definitions, one per line, in the form `[x] done`.
 * Several characters may map to the same name, in which case their counts are summed.
 */
export function parseStateNames(text: string): Map<string, string> {
	const names = new Map<string, string>();
	for (const line of text.split('\n')) {
		const match = /^\s*\[(.)\]\s*(.*?)\s*$/.exec(line);
		if (match?.[1] !== undefined && match[2]) {
			names.set(match[1], match[2]);
		}
	}
	return names;
}

/**
 * Counts the checkboxes in a note by state. Named states are always present (with a
 * count of zero if unused) so queries can rely on them; any other state character is
 * used as its own key.
 */
export function computeStats(
	cache: CachedMetadata | null,
	stateNames: Map<string, string>,
): CheckboxStats {
	const states: Record<string, number> = {};
	for (const name of stateNames.values()) {
		states[name] = 0;
	}

	let total = 0;
	for (const item of cache?.listItems ?? []) {
		if (item.task === undefined) continue;
		const name = stateNames.get(item.task) ?? item.task;
		states[name] = (states[name] ?? 0) + 1;
		total++;
	}

	return { total, states };
}

/** Compares computed stats against a raw frontmatter value, ignoring key order. */
export function statsEqual(stats: CheckboxStats, value: unknown): boolean {
	if (typeof value !== 'object' || value === null) return false;
	const other = value as Partial<CheckboxStats>;
	if (other.total !== stats.total) return false;

	const otherStates = other.states;
	if (typeof otherStates !== 'object' || otherStates === null) return false;

	const keys = Object.keys(stats.states);
	return (
		Object.keys(otherStates).length === keys.length &&
		keys.every((key) => otherStates[key] === stats.states[key])
	);
}
