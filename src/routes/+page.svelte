<script>
	import BinaryView from '$lib/components/BinaryView.svelte';
	import HexView from '$lib/components/HexView.svelte';
	import TextView from '$lib/components/TextView.svelte';

	let bytes = $state(new Uint8Array([]));
	let encoding = $state('utf-8');
	let hoveredByteRange = $state(null);
	let fileInput = $state();
	let fileName = $state('hexeditor.txt');
	let splitContainer = $state();
	let firstSplit = $state(0.6);
	let secondSplit = $state(0.8);
	let activeHandle = $state(null);
	const minPaneRatio = 0.12;

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

	function startResize(handle, event) {
		if (window.matchMedia('(max-width: 980px)').matches) return;
		activeHandle = handle;
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function stopResize() {
		activeHandle = null;
	}

	function handlePointerMove(event) {
		if (!activeHandle || !splitContainer) return;

		const rect = splitContainer.getBoundingClientRect();
		if (rect.width <= 0) return;

		const x = event.clientX - rect.left;
		const ratio = Math.max(0, Math.min(1, x / rect.width));

		if (activeHandle === 'first') {
			firstSplit = Math.max(minPaneRatio, Math.min(secondSplit - minPaneRatio, ratio));
			return;
		}

		if (activeHandle === 'second') {
			secondSplit = Math.max(firstSplit + minPaneRatio, Math.min(1 - minPaneRatio, ratio));
		}
	}
</script>

<svelte:window
	onpointermove={handlePointerMove}
	onpointerup={stopResize}
	onpointercancel={stopResize}
/>

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
	<section
		class="grid"
		bind:this={splitContainer}
		style={`--w1:${firstSplit * 100}%; --w2:${(secondSplit - firstSplit) * 100}%; --w3:${(1 - secondSplit) * 100}%;`}
	>
		<div class="pane pane-binary">
			<BinaryView {bytes} {hoveredByteRange} {setHover} {updateBytes} />
		</div>

		<button
			class="gutter"
			type="button"
			role="separator"
			aria-orientation="vertical"
			aria-label="Breite zwischen Binaer und Hex anpassen"
			onpointerdown={(event) => startResize('first', event)}
		></button>

		<div class="pane pane-hex">
			<HexView {bytes} {hoveredByteRange} {setHover} {updateBytes} />
		</div>

		<button
			class="gutter"
			type="button"
			role="separator"
			aria-orientation="vertical"
			aria-label="Breite zwischen Hex und Text anpassen"
			onpointerdown={(event) => startResize('second', event)}
		></button>

		<div class="pane pane-text">
			<TextView {bytes} {hoveredByteRange} {setHover} {updateBytes} {encoding} {setEncoding} />
		</div>
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
		display: flex;
		align-items: stretch;
		gap: 1rem;
		--w1: 60%;
		--w2: 20%;
		--w3: 20%;
	}

	.pane {
		min-width: 0;
	}

	.pane-binary {
		flex: 0 1 var(--w1);
	}

	.pane-hex {
		flex: 0 1 var(--w2);
	}

	.pane-text {
		flex: 0 1 var(--w3);
	}

	.gutter {
		flex: 0 0 10px;
		cursor: col-resize;
		border-radius: 999px;
		background: linear-gradient(180deg, #d9e2ee 0%, #c4d1e3 100%);
		user-select: none;
		touch-action: none;
	}

	.gutter:hover,
	.gutter:focus {
		outline: none;
		background: linear-gradient(180deg, #b5c7de 0%, #91add0 100%);
	}

	@media (max-width: 980px) {
		.grid {
			flex-direction: column;
		}

		.gutter {
			display: none;
		}
	}
</style>
