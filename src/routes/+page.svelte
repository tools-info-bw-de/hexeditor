<script>
	import BinaryView from '$lib/components/BinaryView.svelte';
	import HexView from '$lib/components/HexView.svelte';
	import TextView from '$lib/components/TextView.svelte';

	let bytes = $state(new Uint8Array([142, 101, 87, 130]));
	let encoding = $state('utf-8');
	let hoveredByteRange = $state(null);

	function setHover(start, length) {
		hoveredByteRange = start !== null ? { start, length } : null;
	}

	function updateBytes(newBytes) {
		bytes = newBytes;
	}

	function setEncoding(nextEncoding) {
		encoding = nextEncoding;
	}
</script>

<main class="app">
	<header>
		<h1>Hex Editor</h1>
		<p>Drei gekoppelte Eingaben: Binary, Hex und Text.</p>
	</header>

	<section class="grid">
		<BinaryView {bytes} {hoveredByteRange} {setHover} {updateBytes} />
		<HexView {bytes} {hoveredByteRange} {setHover} {updateBytes} />
		<TextView {bytes} {hoveredByteRange} {setHover} {updateBytes} {encoding} {setEncoding} />
	</section>
</main>

<style>
	.app {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		color: #1d2a3a;
	}

	header h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	header p {
		margin: 0.35rem 0 1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	@media (max-width: 980px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
