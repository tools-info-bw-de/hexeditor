<script>
	import 'bootstrap/dist/css/bootstrap.min.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();
	onMount(async () => {
		await import('bootstrap/dist/js/bootstrap.bundle.min.js');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Hex-Editor</title>
</svelte:head>

{@render children()}

<style>
</style>
