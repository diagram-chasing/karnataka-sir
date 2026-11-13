<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import latestPosts from '$data/latest-posts.json';
	// 480px WebP
	import logoSrc from '$lib/assets/dc-logo.png?w=480&format=webp';
	import { PAGE_LINKS, SOCIAL_LINKS } from '$lib/site';

	const currentYear = new Date().getFullYear();

	const feedItems = latestPosts.items.map((item) => ({
		...item,
		pubDate: new Date(item.pubDate)
	}));

	// Icon paths from Material Design Icons
	const socials = [
		{
			name: 'RSS Feed',
			href: SOCIAL_LINKS.rss,
			path: 'M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27zm0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93z'
		},
		{
			name: 'GitHub',
			href: SOCIAL_LINKS.github,
			path: 'M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2'
		},
		{
			name: 'Instagram',
			href: SOCIAL_LINKS.instagram,
			path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3'
		},
		{
			name: 'LinkedIn',
			href: SOCIAL_LINKS.linkedin,
			path: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z'
		}
	];
</script>

<footer class="px-4 pb-10 md:px-0">
	<div class="mx-auto max-w-[600px]">
		<h2 class="mb-8 text-center font-heading text-lg font-normal tracking-tight text-foreground">
			~ More from Us ~
		</h2>

		{#if feedItems.length > 0}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#each feedItems as item (item.link)}
					<a
						href={item.link}
						target="_blank"
						rel="noopener noreferrer"
						class="feed-card flex flex-col text-foreground no-underline transition-[box-shadow,transform] duration-150 hover:shadow-md"
					>
						{#if item.image}
							<div class="h-40 w-full flex-shrink-0 overflow-hidden">
								<img
									src={item.image}
									alt={item.title}
									loading="lazy"
									class="h-full w-full object-cover mix-blend-multiply"
								/>
							</div>
						{/if}
						<div class="flex flex-1 flex-col gap-1.5 p-3">
							<h3 class="m-0 font-heading text-lg leading-snug font-bold text-foreground">
								{item.title}
							</h3>
							<p
								class="m-0 flex-1 font-sans text-[0.8rem] leading-relaxed text-pretty text-muted-foreground"
							>
								{item.description}
							</p>
							<time class="mt-1 font-sans text-[0.7rem] text-muted-foreground opacity-75">
								{item.pubDate.toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</time>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<p class="text-center font-sans text-sm text-muted-foreground">
				No recent posts —
				<a
					href="https://diagramchasing.fun"
					target="_blank"
					rel="noopener noreferrer"
					class="text-foreground underline underline-offset-[3px]"
					>visit Diagram Chasing <ArrowRight
						class="inline-block align-[-0.125em]"
						size={14}
						aria-hidden="true"
					/></a
				>
			</p>
		{/if}
	</div>

	<div
		class="mx-0 mt-16 mb-0 px-0 py-8 text-center text-lg leading-normal text-foreground antialiased max-sm:px-5 max-sm:py-10 max-sm:text-base"
	>
		<div class="mb-3.5 flex justify-center">
			<a
				href="https://diagramchasing.fun"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Diagram Chasing — home"
				class="inline-flex flex-col items-center gap-2 text-foreground no-underline"
			>
				<img
					src={logoSrc}
					alt="Diagram Chasing"
					width="1000"
					height="328"
					loading="lazy"
					decoding="async"
					class="h-12 w-auto border border-foreground bg-white px-2 py-1 shadow"
				/>
			</a>
		</div>

		<ul class="mt-5 mb-[15px] flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0">
			{#each PAGE_LINKS as link (link.href)}
				<li class="my-0 p-0">
					<a
						href={link.href}
						class="text-base leading-[1.6em] text-foreground no-underline transition-colors hover:text-muted-foreground max-sm:text-sm"
						>{link.name}</a
					>
				</li>
			{/each}
		</ul>

		<ul class="mt-3 list-none p-0 px-5 text-center">
			{#each socials as social (social.name)}
				<li class="mx-1.5 my-0 inline-block p-0 leading-[1.6em]">
					<a
						href={social.href}
						target={social.href.startsWith('http') ? '_blank' : undefined}
						rel="noopener noreferrer"
						class="inline-flex size-10 items-center justify-center text-foreground no-underline opacity-80 transition-colors hover:text-muted-foreground active:scale-95"
						aria-label={social.name}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							class="max-sm:h-5 max-sm:w-5"
						>
							<path fill="currentColor" d={social.path} />
						</svg>
					</a>
				</li>
			{/each}
		</ul>

		<p class="mt-2 p-0 text-base leading-normal text-muted-foreground">
			&copy; {currentYear} Diagram Chasing
		</p>
	</div>
</footer>

<style>
	.feed-card {
		background: var(--muted);
		border: 1px solid color-mix(in oklch, var(--foreground) 25%, transparent);
		box-shadow:
			0 0.9px 4px rgba(0, 0, 0, 0.08),
			0 0px 2px rgba(0, 0, 0, 0.07);
	}
</style>
