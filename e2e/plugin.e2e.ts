import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/settings';
import {
	evaluate,
	modifiedTime,
	obsidian,
	PLUGIN_ID,
	property,
	readNote,
	runCommand,
	SETTLE_MS,
	setSettings,
	sleep,
	VAULT_PATH,
	writeNote,
} from './obsidian';

const FOLDER = 'e2e-tests';
let noteCount = 0;

/** Creates a note with a unique path so tests can't see each other's changes. */
async function createNote(content: string): Promise<string> {
	const path = `${FOLDER}/note ${++noteCount}.md`;
	await writeNote(path, content);
	return path;
}

/** Waits for the plugin to write the expected stats. */
async function expectStats(path: string, expected: unknown, name = 'checkboxes') {
	await expect.poll(() => property(path, name)).toEqual(expected);
}

const removeFolder = () =>
	evaluate(
		`app.vault.adapter.exists("${FOLDER}").then((exists) => exists && app.vault.adapter.rmdir("${FOLDER}", true))`,
	);

beforeAll(async () => {
	const vaultPath = await obsidian('vault', { info: 'path' }).catch(() => '');
	if (vaultPath !== VAULT_PATH) {
		throw new Error(
			`The Obsidian CLI isn't connected to the demo vault (got "${vaultPath}"). ` +
				'Run `npm run demo`, open demo-vault in Obsidian, and try again.',
		);
	}

	// Load the latest build.
	await obsidian('plugin:reload', { id: PLUGIN_ID });
	await obsidian('dev:errors', {}, ['clear']);
	await removeFolder();
	await evaluate(`app.vault.createFolder("${FOLDER}").then(() => null)`);
});

beforeEach(async () => {
	await setSettings(DEFAULT_SETTINGS);
});

afterAll(async () => {
	await removeFolder();
	// Restore the saved settings.
	await obsidian('plugin:reload', { id: PLUGIN_ID });
});

describe('when a note changes', () => {
	it('leaves notes without checkboxes alone', async () => {
		const path = await createNote('# No checkboxes\n\n- Just a list\n');
		await obsidian('append', { path, content: 'More text' });
		await sleep(SETTLE_MS);

		expect(await property(path)).toBeNull();
	});

	it('adds the property when the first checkbox is added', async () => {
		const path = await createNote('Nothing to do yet.\n');
		await obsidian('append', { path, content: '- [ ] First task' });

		await expectStats(path, { total: 1, states: { todo: 1, done: 0 } });
	});

	it('keeps existing properties and content', async () => {
		const body = '- [ ] One\n- [x] Two\n';
		const path = await createNote(`---\nstatus: active\ntags:\n  - demo\n---\n${body}`);

		await expectStats(path, { total: 2, states: { todo: 1, done: 1 } });
		expect(await readNote(path)).toBe(
			[
				'---',
				'status: active',
				'tags:',
				'  - demo',
				'checkboxes:',
				'  total: 2',
				'  states:',
				'    todo: 1',
				'    done: 1',
				'---',
				body.trimEnd(),
			].join('\n'),
		);
	});

	it('updates when a checkbox is ticked or given another state', async () => {
		const path = await createNote('- [ ] One\n- [ ] Two\n');
		await expectStats(path, { total: 2, states: { todo: 2, done: 0 } });

		// The property added 7 lines of frontmatter above the tasks.
		await obsidian('task', { path, line: 8 }, ['toggle']);
		await obsidian('task', { path, line: 9, status: '/' });

		await expectStats(path, { total: 2, states: { todo: 0, done: 1, '/': 1 } });
	});

	it('counts nested, numbered and callout checkboxes but not code blocks', async () => {
		const path = await createNote(
			[
				'- [ ] Parent',
				'\t- [x] Child',
				'\t\t- [X] Grandchild',
				'1. [-] Numbered',
				'> [!note]',
				'> - [ ] In a callout',
				'```',
				'- [ ] In a code block',
				'```',
				'    - [ ] In an indented code block',
				'Not in a list: [ ]',
				'- Plain list item',
			].join('\n'),
		);

		await expectStats(path, { total: 5, states: { todo: 2, done: 2, '-': 1 } });
	});

	it('corrects stale stats', async () => {
		const path = await createNote(
			'---\ncheckboxes:\n  total: 10\n  states:\n    todo: 7\n    done: 3\n---\n- [ ] One\n',
		);

		await expectStats(path, { total: 1, states: { todo: 1, done: 0 } });
	});

	it('does not rewrite a note whose stats are up to date', async () => {
		const path = await createNote('- [ ] One\n');
		await expectStats(path, { total: 1, states: { todo: 1, done: 0 } });
		await sleep(SETTLE_MS);
		const before = await modifiedTime(path);

		await sleep(SETTLE_MS);
		expect(await modifiedTime(path)).toBe(before);
	});

	describe('when the last checkbox is removed', () => {
		it('sets the total to zero', async () => {
			const path = await createNote('- [ ] One\n- [x] Two\n');
			await expectStats(path, { total: 2, states: { todo: 1, done: 1 } });

			await writeNote(path, (await readNote(path)).replace(/^- \[.\] .*$/gm, ''));
			await expectStats(path, { total: 0, states: { todo: 0, done: 0 } });
		});

		it('removes the property when "Remove property when empty" is on', async () => {
			await setSettings({ removeWhenEmpty: true });
			const path = await createNote('---\nstatus: active\n---\n- [ ] One\n');
			await expectStats(path, { total: 1, states: { todo: 1, done: 0 } });

			await writeNote(path, (await readNote(path)).replace('- [ ] One', ''));
			await expectStats(path, null);
			expect(await property(path, 'status')).toBe('active');
		});
	});
});

describe('settings', () => {
	it('writes to the configured property name', async () => {
		await setSettings({ propertyName: 'tasks' });
		const path = await createNote('- [x] One\n');

		await expectStats(path, { total: 1, states: { todo: 0, done: 1 } }, 'tasks');
		expect(await property(path)).toBeNull();
	});

	it('uses the configured state names', async () => {
		await setSettings({ stateNames: '[ ] open\n[x] closed\n[/] closed' });
		const path = await createNote('- [ ] One\n- [x] Two\n- [/] Three\n- [?] Four\n');

		await expectStats(path, { total: 4, states: { open: 1, closed: 2, '?': 1 } });
	});
});

describe('commands', () => {
	const renamed = { total: 1, states: { open: 0, closed: 1 } };

	/** Creates an up-to-date note, then renames the states without changing the note. */
	async function createNoteWithStaleNames(): Promise<string> {
		const path = await createNote('- [x] One\n');
		await expectStats(path, { total: 1, states: { todo: 0, done: 1 } });
		return path;
	}

	it('updates the current note', async () => {
		const current = await createNoteWithStaleNames();
		const other = await createNoteWithStaleNames();
		await setSettings({ stateNames: '[ ] open\n[x] closed' });

		await obsidian('open', { path: current });
		await runCommand('update-current-note');

		await expectStats(current, renamed);
		expect(await property(other)).toEqual({ total: 1, states: { todo: 0, done: 1 } });
	});

	it('updates all notes and reports how many changed', async () => {
		const first = await createNoteWithStaleNames();
		const second = await createNoteWithStaleNames();
		await setSettings({ stateNames: '[ ] open\n[x] closed' });

		try {
			await runCommand('update-all-notes');

			await expectStats(first, renamed);
			await expectStats(second, renamed);
			const notices = await obsidian('dev:dom', { selector: '.notice' }, ['text', 'all']);
			expect(notices).toMatch(/Updated checkbox stats in \d+ notes\./);
		} finally {
			// This also renamed the states in the demo notes, so put them back.
			await setSettings(DEFAULT_SETTINGS);
			await runCommand('update-all-notes');
		}
	});
});

it('logs no errors', async () => {
	expect(await obsidian('dev:errors')).toBe('No errors captured.');
});
