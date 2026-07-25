<script>
	import BinaryView from '$lib/components/BinaryView.svelte';
	import HexView from '$lib/components/HexView.svelte';
	import TextView from '$lib/components/TextView.svelte';

	let bytes = $state(new Uint8Array([]));
	let encoding = $state('utf-8');
	let hoveredByteRange = $state(null);
	let fileInput = $state();
	let fileName = $state('hexeditor.txt');

	function setHover(start, length) {
		hoveredByteRange = start !== null ? { start, length } : null;
	}

	function updateBytes(newBytes) {
		bytes = newBytes;
	}

	function setEncoding(nextEncoding) {
		encoding = nextEncoding;
	}

	function handleEncodingChange(event) {
		setEncoding(event.currentTarget.value);
	}

	function openFile() {
		fileInput?.click();
	}

	async function handleFileSelection(event) {
		const file = event.currentTarget.files?.[0];
		if (!file) return;

		const buffer = await file.arrayBuffer();
		bytes = new Uint8Array(buffer);
		hoveredByteRange = null;
		fileName = file.name || 'hexeditor.txt';

		// Allow selecting the same file again.
		event.currentTarget.value = '';
	}

	async function saveFile() {
		await saveFileWithDialog();
	}

	async function saveFileWithDialog() {
		const suggestedName = fileName || 'hexeditor.txt';

		try {
			const handle = await window.showSaveFilePicker({
				suggestedName,
				types: [
					{
						description: 'Binary file',
						accept: {
							'application/octet-stream': ['.bin', '.dat', '.raw']
						}
					}
				]
			});

			const writable = await handle.createWritable();
			await writable.write(bytes);
			await writable.close();
			fileName = handle.name || suggestedName;
		} catch (error) {
			if (error?.name === 'AbortError') return;
			console.error('Save failed:', error);
			saveFileWithFallback(suggestedName);
		}
	}

	function saveFileWithFallback(suggestedName) {
		const blob = new Blob([bytes], { type: 'application/octet-stream' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = suggestedName;
		anchor.click();
		URL.revokeObjectURL(url);
	}
</script>

<main class="app">
	<h1>Hex-Editor</h1>

	<div class="d-flex mb-3">
		<input
			bind:this={fileInput}
			type="file"
			class="d-none"
			onchange={handleFileSelection}
			aria-label="Binary file input"
		/>

		<div class="dropdown">
			<button
				class="btn btn-primary dropdown-toggle"
				type="button"
				data-bs-toggle="dropdown"
				aria-expanded="false"
			>
				Datei
			</button>
			<ul class="dropdown-menu">
				<li><button type="button" class="dropdown-item" onclick={openFile}>Öffnen</button></li>
				<li><button type="button" class="dropdown-item" onclick={saveFile}>Speichern</button></li>
			</ul>
		</div>

		<label class="encoding ms-auto">
			<span>Codierung</span>
			<select
				class="form-select"
				value={encoding}
				onchange={handleEncodingChange}
				aria-label="Text encoding"
			>
				<option value="utf-8">UTF-8</option>
				<option value="iso-8859-1">ISO-8859-1</option>
				<option value="ascii">ASCII</option>
			</select>
		</label>
	</div>
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

	h1 {
		text-align: center;
	}

	.encoding {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
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
