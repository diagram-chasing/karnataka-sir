<script lang="ts">
	import { story, SITE_BASE, CANONICAL_ORIGIN, absUrl } from '$lib/site';

	interface Author {
		name: string;
		link: string;
	}

	interface Props {
		/** Canonical absolute URL (origin + subpath). Also used for og:url. */
		canonicalUrl?: string;
		/** The <title> and the og and twitter titles fall back to this. */
		seoTitle?: string;
		seoDescription?: string;
		/** Social-card overrides. Default to the SEO title and description. */
		shareTitle?: string;
		shareDescription?: string;
		/** Absolute URL of the 1200x630 share image. */
		shareImgPath?: string;
		/** Optional animated GIF; replaces og:image, while twitter:image stays on shareImgPath. */
		shareImgAnimatedPath?: string;
		shareImgAlt?: string;
		/** og:type. Use 'website' for tools and index pages, 'article' for stories. */
		ogType?: 'website' | 'article';
		siteName?: string;
		/** When set, the page is described as an Article (with these dates). */
		publishTime?: string;
		updateTime?: string;
		authors?: Author[];
		keywords?: string[];
	}

	// Everything defaults from story.config.js. A page can render a bare <SEO />
	// and override only what differs.
	let {
		canonicalUrl = SITE_BASE,
		seoTitle = `${story.title} — ${story.siteName}`,
		seoDescription = story.description,
		shareTitle = story.title,
		shareDescription,
		shareImgPath = absUrl(story.shareImage),
		shareImgAnimatedPath = '',
		shareImgAlt = story.shareImageAlt,
		ogType = 'article',
		siteName = story.siteName,
		publishTime = story.publishTime,
		updateTime = story.updateTime,
		authors = story.authors,
		keywords = story.keywords
	}: Props = $props();

	let ogTitle = $derived(shareTitle ?? seoTitle);
	let ogDescription = $derived(shareDescription ?? seoDescription);

	const PUBLISHER = `${CANONICAL_ORIGIN}/#publisher`;
	const orgLdJson = {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': PUBLISHER,
		name: story.siteName,
		url: `${CANONICAL_ORIGIN}/`
	};

	// Escape `<` so a closing script tag inside a string cannot end the JSON-LD block.
	const ldJson = (o: object) => JSON.stringify(o).replace(/</g, '\\u003c');

	// Emits an Article when a publish date exists (stories); otherwise a plain WebPage.
	let pageLdJson = $derived(
		publishTime
			? {
					'@context': 'https://schema.org',
					'@type': 'Article',
					headline: seoTitle,
					description: seoDescription,
					url: canonicalUrl,
					mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
					thumbnailUrl: shareImgPath,
					image: [{ '@type': 'ImageObject', url: shareImgPath }],
					publisher: { '@id': PUBLISHER },
					copyrightHolder: { '@id': PUBLISHER },
					copyrightYear: new Date().getFullYear(),
					datePublished: publishTime,
					dateModified: updateTime || publishTime,
					author: authors.map(({ name, link }) => ({ '@type': 'Person', name, url: link })),
					isAccessibleForFree: true,
					keywords
				}
			: {
					'@context': 'https://schema.org',
					'@type': 'WebPage',
					name: seoTitle,
					description: seoDescription,
					url: canonicalUrl,
					image: shareImgPath,
					publisher: { '@id': PUBLISHER },
					isAccessibleForFree: true,
					keywords
				}
	);
</script>

<svelte:head>
	<title>{seoTitle}</title>
	<meta name="description" content={seoDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content={publishTime ? ogType : 'website'} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<!-- a single og:image: Discord turns multiple og:image tags into a gallery -->
	<meta property="og:image" content={shareImgAnimatedPath || shareImgPath} />
	{#if shareImgAnimatedPath}<meta property="og:image:type" content="image/gif" />{/if}
	{#if shareImgAlt}<meta property="og:image:alt" content={shareImgAlt} />{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="twitter:image" content={shareImgPath} />
	{#if shareImgAlt}<meta name="twitter:image:alt" content={shareImgAlt} />{/if}

	<!-- The JSON-LD comes from our own config, not user input. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<${'script'} type="application/ld+json">${ldJson(orgLdJson)}</script>`}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<${'script'} type="application/ld+json">${ldJson(pageLdJson)}</script>`}
</svelte:head>
