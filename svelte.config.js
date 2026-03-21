import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-static outputs a fully pre-rendered / SPA bundle
		// that Tauri can serve directly from disk (no Node server needed).
		adapter: adapter({
			fallback: 'index.html' // SPA mode: unknown routes fall back to index.html
		})
	}
};

export default config;
