import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import type { CheckboxStatsSettings } from '../src/settings';

export { setTimeout as sleep } from 'node:timers/promises';

const execFileAsync = promisify(execFile);

const ROOT = resolve(import.meta.dirname, '..');
export const VAULT_PATH = resolve(ROOT, 'demo-vault');
export const PLUGIN_ID = (
	JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf8')) as { id: string }
).id;

/** Longer than the plugin's update delay, plus time for Obsidian to reindex. */
export const SETTLE_MS = 2500;

/**
 * Runs an Obsidian CLI command. The CLI targets the vault containing its working
 * directory, so commands always run from the demo vault. It reports failures on
 * stdout with a zero exit code, so those are turned into exceptions here.
 */
export async function obsidian(
	command: string,
	params: Record<string, string | number> = {},
	flags: string[] = [],
): Promise<string> {
	const args = [
		command,
		...Object.entries(params).map(([key, value]) => `${key}=${value}`),
		...flags,
	];
	const { stdout } = await execFileAsync(process.env.OBSIDIAN_CLI ?? 'obsidian', args, {
		cwd: VAULT_PATH,
	});
	const output = stdout.trim();
	if (output.startsWith('Error:')) {
		throw new Error(`obsidian ${args.join(' ')}\n${output}`);
	}
	return output;
}

/** Runs JavaScript in the app, awaiting promises, and returns the JSON-decoded result. */
export async function evaluate<T = unknown>(code: string): Promise<T> {
	const output = await obsidian('eval', {
		code: `Promise.resolve(${code}).then((value) => JSON.stringify(value ?? null))`,
	});
	return JSON.parse(output.replace(/^=> /, '')) as T;
}

const fileExpr = (path: string) => `app.vault.getFileByPath(${JSON.stringify(path)})`;

/** Creates or overwrites a note through the vault API, as the editor would. */
export async function writeNote(path: string, content: string): Promise<void> {
	await evaluate(
		`(${fileExpr(path)}
			? app.vault.modify(${fileExpr(path)}, ${JSON.stringify(content)})
			: app.vault.create(${JSON.stringify(path)}, ${JSON.stringify(content)})
		).then(() => null)`,
	);
}

export function readNote(path: string): Promise<string> {
	return obsidian('read', { path });
}

/** Reads a note's frontmatter from the metadata cache. */
export function frontmatter(path: string): Promise<Record<string, unknown> | null> {
	return evaluate(`app.metadataCache.getFileCache(${fileExpr(path)})?.frontmatter`);
}

export async function property(path: string, name = 'checkboxes'): Promise<unknown> {
	return (await frontmatter(path))?.[name] ?? null;
}

export function modifiedTime(path: string): Promise<number> {
	return evaluate(`${fileExpr(path)}.stat.mtime`);
}

/** Changes the plugin's settings in memory. Reloading the plugin restores the saved ones. */
export async function setSettings(settings: Partial<CheckboxStatsSettings>): Promise<void> {
	await evaluate(
		`void Object.assign(app.plugins.plugins[${JSON.stringify(PLUGIN_ID)}].settings, ${JSON.stringify(settings)})`,
	);
}

export function runCommand(id: string): Promise<string> {
	return obsidian('command', { id: `${PLUGIN_ID}:${id}` });
}
