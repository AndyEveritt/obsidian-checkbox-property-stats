// Creates or resets demo-vault/ from the notes in scripts/demo-notes/.
// Obsidian's own state in demo-vault/.obsidian (workspace, plugin settings) is kept.

import {
	copyFileSync,
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vault = join(root, 'demo-vault');
const configDir = join(vault, '.obsidian');
const { id } = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const pluginDir = join(configDir, 'plugins', id);

// Replace every note with a fresh copy.
mkdirSync(vault, { recursive: true });
for (const entry of readdirSync(vault)) {
	if (entry !== '.obsidian') {
		rmSync(join(vault, entry), { recursive: true, force: true });
	}
}
cpSync(join(root, 'scripts', 'demo-notes'), vault, { recursive: true });

// Link the plugin to the build output so rebuilds are picked up without copying.
mkdirSync(pluginDir, { recursive: true });
for (const file of ['main.js', 'manifest.json']) {
	const target = join(root, file);
	const link = join(pluginDir, file);
	rmSync(link, { force: true });
	try {
		symlinkSync(relative(pluginDir, target), link);
	} catch {
		// Symlinks can need extra permissions on Windows; fall back to a copy.
		if (existsSync(target)) copyFileSync(target, link);
		console.warn(`Couldn't link ${file}; copied it instead. Rerun after each build.`);
	}
}

// Enable the plugin, keeping any others enabled in the vault.
const enabledPath = join(configDir, 'community-plugins.json');
const enabled = existsSync(enabledPath)
	? JSON.parse(readFileSync(enabledPath, 'utf8'))
	: [];
if (!enabled.includes(id)) {
	writeFileSync(enabledPath, JSON.stringify([...enabled, id], null, 2) + '\n');
}

console.log(`Demo vault ready at ${relative(process.cwd(), vault) || '.'}`);
if (!existsSync(join(root, 'main.js'))) {
	console.log('main.js not built yet: run `npm run dev` or `npm run build`.');
}
