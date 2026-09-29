import type { CachedMetadata } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/settings';
import { computeStats, parseStateNames, statsEqual } from '../src/stats';

function cache(items: (string | undefined)[]): CachedMetadata {
	return { listItems: items.map((task) => ({ task })) } as CachedMetadata;
}

const names = parseStateNames(DEFAULT_SETTINGS.stateNames);

describe('parseStateNames', () => {
	it('parses the default state names', () => {
		expect([...names]).toEqual([
			[' ', 'todo'],
			['/', 'in-progress'],
			['x', 'done'],
			['X', 'done'],
			['-', 'cancelled'],
		]);
	});

	it('trims names and surrounding whitespace', () => {
		expect([...parseStateNames('  [/]   in progress  ')]).toEqual([['/', 'in progress']]);
	});

	it('ignores blank, malformed and unnamed lines', () => {
		const text = '\n[x] done\nnot a state\n[xy] two chars\n[] empty\n[-]\n[?]   \n';
		expect([...parseStateNames(text)]).toEqual([['x', 'done']]);
	});

	it('uses the last name given for a repeated character', () => {
		expect(parseStateNames('[x] done\n[x] complete').get('x')).toBe('complete');
	});

	it('handles Windows line endings', () => {
		expect([...parseStateNames('[ ] todo\r\n[x] done\r\n')]).toEqual([
			[' ', 'todo'],
			['x', 'done'],
		]);
	});
});

describe('computeStats', () => {
	it('counts checkboxes by state name', () => {
		expect(computeStats(cache([' ', 'x', ' ', '/', 'x', '-', ' ']), names, 'unknown')).toEqual({
			total: 7,
			states: { todo: 3, 'in-progress': 1, done: 2, cancelled: 1 },
		});
	});

	it('sums characters that share a name', () => {
		expect(computeStats(cache(['x', 'X', 'X']), names, 'unknown')).toEqual({
			total: 3,
			states: { todo: 0, 'in-progress': 0, done: 3, cancelled: 0 },
		});
	});

	it('counts unnamed states under the unknown name', () => {
		expect(computeStats(cache(['?', '>', '?', ' ']), names, 'unknown')).toEqual({
			total: 4,
			states: { todo: 1, 'in-progress': 0, done: 0, cancelled: 0, unknown: 3 },
		});
	});

	it('uses the character itself for unnamed states when the unknown name is empty', () => {
		expect(computeStats(cache(['?', '>', '?', ' ']), names, '')).toEqual({
			total: 4,
			states: { todo: 1, 'in-progress': 0, done: 0, cancelled: 0, '?': 2, '>': 1 },
		});
	});

	it('merges unnamed states into a named state with the same name', () => {
		expect(computeStats(cache(['?', ' ']), names, 'todo')).toEqual({
			total: 2,
			states: { todo: 2, 'in-progress': 0, done: 0, cancelled: 0 },
		});
	});

	it('ignores list items that are not checkboxes', () => {
		expect(computeStats(cache([undefined, 'x', undefined]), names, 'unknown')).toEqual({
			total: 1,
			states: { todo: 0, 'in-progress': 0, done: 1, cancelled: 0 },
		});
	});

	it('includes every named state with a zero count when there are no checkboxes', () => {
		const empty = { total: 0, states: { todo: 0, 'in-progress': 0, done: 0, cancelled: 0 } };
		expect(computeStats(null, names, 'unknown')).toEqual(empty);
		expect(computeStats({}, names, 'unknown')).toEqual(empty);
		expect(computeStats(cache([undefined]), names, 'unknown')).toEqual(empty);
	});

	it('uses raw characters for everything when no names are configured', () => {
		expect(computeStats(cache([' ', 'x']), new Map(), '')).toEqual({
			total: 2,
			states: { ' ': 1, x: 1 },
		});
	});
});

describe('statsEqual', () => {
	const stats = { total: 3, states: { todo: 1, done: 2 } };

	it('matches identical stats regardless of key order', () => {
		expect(statsEqual(stats, { states: { done: 2, todo: 1 }, total: 3 })).toBe(true);
	});

	it.each([
		['a different total', { total: 4, states: { todo: 1, done: 2 } }],
		['a different count', { total: 3, states: { todo: 2, done: 1 } }],
		['a missing state', { total: 3, states: { done: 2 } }],
		['an extra state', { total: 3, states: { todo: 1, done: 2, '/': 0 } }],
		['a count stored as a string', { total: 3, states: { todo: '1', done: 2 } }],
		['missing states', { total: 3 }],
		['states that are not an object', { total: 3, states: 'todo' }],
		['null states', { total: 3, states: null }],
	])('rejects %s', (_, value) => {
		expect(statsEqual(stats, value)).toBe(false);
	});

	it.each([undefined, null, 3, 'checkboxes', []])('rejects the non-object value %j', (value) => {
		expect(statsEqual(stats, value)).toBe(false);
	});
});
