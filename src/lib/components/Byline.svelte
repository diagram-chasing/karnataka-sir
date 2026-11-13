<script lang="ts">
	import { story } from '$lib/site';

	const names = story.authors.map((a) => a.name);
	const dateline = story.publishTime
		? new Date(story.publishTime).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})
		: '';

	function separator(i: number): string {
		if (i >= names.length - 1) return '';
		return i === names.length - 2 ? ' and ' : ', ';
	}
</script>

<p class="byline">
	By
	{#each story.authors as author, i (author.name)}<a
			href={author.link}
			target="_blank"
			rel="noopener noreferrer">{author.name}</a
		>{separator(i)}{/each}{#if dateline}{' · '}<time datetime={story.publishTime}>{dateline}</time
		>{/if}
</p>
