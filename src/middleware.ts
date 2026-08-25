import { defineMiddleware } from 'astro:middleware';
import homeMd from './markdown/home.md?raw';
import cvMd from './markdown/cv.md?raw';
import linksMd from './markdown/links.md?raw';
import aboutMd from './markdown/about.md?raw';
import contactMd from './markdown/contact.md?raw';
import privacyMd from './markdown/privacy.md?raw';

// Only routes with a markdown twin get content-negotiated; every other
// (fully static) route is untouched and never runs this middleware.
const MARKDOWN_BY_PATH: Record<string, string> = {
	'/': homeMd,
	'/cv': cvMd,
	'/links': linksMd,
	'/about': aboutMd,
	'/contact': contactMd,
	'/privacy': privacyMd,
};

// Good enough for the two cases that matter: a bare `Accept: text/markdown`
// (agents, acceptmarkdown.com) must win, and a browser's
// `Accept: text/html,application/xhtml+xml,...` must never match.
function prefersMarkdown(accept: string | null): boolean {
	if (!accept) return false;
	const weight = (mime: string) => {
		const entry = accept
			.split(',')
			.map((part) => part.trim())
			.find((part) => part.split(';')[0].trim().toLowerCase() === mime);
		if (!entry) return -1;
		const q = entry.split(';')[1]?.trim().match(/^q=([\d.]+)/)?.[1];
		return q ? parseFloat(q) : 1;
	};

	const markdownQ = weight('text/markdown');
	if (markdownQ < 0) return false;
	return markdownQ >= weight('text/html');
}

export const onRequest = defineMiddleware(async (context, next) => {
	const path = context.url.pathname.replace(/\/$/, '') || '/';
	const markdown = MARKDOWN_BY_PATH[path];

	if (!markdown) return next();

	if (prefersMarkdown(context.request.headers.get('accept'))) {
		return new Response(markdown, {
			status: 200,
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Vary': 'Accept, Accept-Encoding',
			},
		});
	}

	const response = await next();
	response.headers.set('Vary', 'Accept, Accept-Encoding');
	return response;
});
