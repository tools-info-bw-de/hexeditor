<script>
	import BinaryView from '$lib/components/BinaryView.svelte';
	import HexView from '$lib/components/HexView.svelte';
	import TextView from '$lib/components/TextView.svelte';

	let bytes = $state(new Uint8Array([142, 101, 87, 130]));
	let encoding = $state('utf-8');
	let availableEncodings = $state(['ascii', 'iso-8859-1', 'utf-8']);

	let hoveredByteRange = $state(null); // z.B. { start: 0, length: 1 }

	// byte-based
	function setHover(start, length) {
		hoveredByteRange = start !== null ? { start, length } : null;
	}

	let tokens = $derived(parseBytesToTokens(bytes, encoding));

	function updateBytes(newBytes) {
		bytes = newBytes;
	}

	function parseBytesToTokens(bytes, encoding) {
		const tokens = [];

		if (encoding === 'utf-8') {
			let i = 0;
			while (i < bytes.length) {
				const byte = bytes[i];
				let length;

				// UTF-8 Byte-Längen anhand der ersten Bits bestimmen:
				if ((byte & 0x80) === 0)
					length = 1; // ASCII (0xxxxxxx)
				else if ((byte & 0xe0) === 0xc0)
					length = 2; // 110xxxxx
				else if ((byte & 0xf0) === 0xe0)
					length = 3; // 1110xxxx
				else if ((byte & 0xf8) === 0xf0)
					length = 4; // 11110xxx
				else length = 1; // Defektes Byte

				// Sicherstellen, dass wir nicht über das Ende des Arrays hinauslesen
				const actualLength = Math.min(length, bytes.length - i);
				const slice = bytes.subarray(i, i + actualLength);

				// Decodieren des genauen Byte-Abschnitts
				const decoder = new TextDecoder(encoding, { fatal: false });
				const char = decoder.decode(slice) || '';

				tokens.push({
					char: char,
					byteOffset: i,
					byteLength: actualLength,
					isValid: !char.includes('')
				});

				i += actualLength;
			}
		} else {
			// Für Ein-Byte-Encodings (ASCII, ISO-8859-1 etc.) ist 1 Byte = 1 Zeichen
			for (let i = 0; i < bytes.length; i++) {
				const decoder = new TextDecoder(encoding, { fatal: false });
				const char = decoder.decode(bytes.subarray(i, i + 1)) || '';

				tokens.push({
					char: char,
					byteOffset: i,
					byteLength: 1,
					isValid: true
				});
			}
		}
		return tokens;
	}
</script>

<div id="app">
	<h1>Welcome to SvelteKit</h1>
	<p>
		Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation
	</p>

	<div class="scroll-container">
		<div class="three-columns">
			<!-- Komponenten haben KEIN overflow-y: auto -->
			<BinaryView {bytes} {hoveredByteRange} {setHover} {updateBytes} />
			<HexView {tokens} {hoveredByteRange} {setHover} {updateBytes} />
			<TextView {tokens} {hoveredByteRange} {setHover} {updateBytes} />
		</div>
	</div>
</div>

<style>
	#app {
		text-align: center;
		margin-top: 20px;
	}

	.scroll-container {
		height: 100vh;
		overflow-y: auto; /* Einziger Scrollbalken */
	}

	.three-columns {
		display: flex;
		gap: 20px;
	}
</style>
