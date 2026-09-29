import { defineConfig } from 'vitest/config';

// End-to-end tests drive a running Obsidian through its CLI. See e2e/obsidian.ts.
export default defineConfig({
	test: {
		include: ['e2e/**/*.e2e.ts'],
		// Tests share one app and vault.
		fileParallelism: false,
		testTimeout: 20_000,
		hookTimeout: 20_000,
		expect: { poll: { timeout: 5_000, interval: 250 } },
	},
});
