<script>
	// A masked voter ID for Trail; `gone` marks an ID that was replaced.
	/** @type {{ prefix: string, suffix: string, gone?: boolean }} */
	let { prefix, suffix, gone = false } = $props();
</script>

<span
	class="vid"
	class:gone
	aria-label="{gone ? 'Old voter ID' : 'Voter ID'} {prefix}, hidden digits, {suffix}"
	>{prefix}<span class="mask"></span>{suffix}</span
>

<style>
	.vid {
		display: inline-block;
		padding: 0.3rem 0.55rem;
		border-radius: 2px;
		background: var(--d-w0);
		font-family: var(--font-mono);
		font-size: var(--text-1);
		line-height: 1;
		white-space: nowrap;
	}
	.gone {
		background: color-mix(in oklch, var(--foreground) 9%, var(--background));
		color: color-mix(in oklch, var(--foreground) 62%, var(--background));
	}
	/* the hidden digits */
	.mask {
		display: inline-block;
		width: 1.6em;
		height: 0.72em;
		margin-inline: 0.12em;
		vertical-align: -0.02em;
		background: rgb(43 43 43 / 0.28);
	}
</style>
