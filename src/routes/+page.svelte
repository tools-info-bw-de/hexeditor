<script>
	import BinaryView from '$lib/components/BinaryView.svelte';
	import HexView from '$lib/components/HexView.svelte';
	import TextView from '$lib/components/TextView.svelte';

	let bytes = $state(new Uint8Array([]));
	let encoding = $state('utf-8');
	let hoveredByteRange = $state(null);
	let fileName = $state('hexeditor.txt');
	let splitContainer = $state();
	let firstSplit = $state(0.6);
	let secondSplit = $state(0.8);
	let activeHandle = $state(null);
	let dragOffset = $state(0);
	const minPaneRatio = 0.12;
	let textAreaHeight = $state(0);

	function handleTextAreaHeightChange(nextHeight) {
		if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
		const normalizedHeight = Math.round(nextHeight);
		if (normalizedHeight === textAreaHeight) return;
		textAreaHeight = normalizedHeight;
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function getSplitMetrics() {
		if (!splitContainer) return null;

		const rect = splitContainer.getBoundingClientRect();
		if (rect.width <= 0) return null;

		const styles = getComputedStyle(splitContainer);
		const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
		const childCount = splitContainer.children.length;
		const totalGapWidth = gap * Math.max(0, childCount - 1);

		const gutters = splitContainer.querySelectorAll('.gutter');
		const firstGutterWidth = gutters[0]?.getBoundingClientRect().width || 0;
		const secondGutterWidth = gutters[1]?.getBoundingClientRect().width || firstGutterWidth;
		const totalFixedWidth = totalGapWidth + firstGutterWidth + secondGutterWidth;
		const paneTrackWidth = rect.width - totalFixedWidth;

		if (paneTrackWidth <= 0) return null;

		return {
			rect,
			paneTrackWidth,
			firstAnchorOffset: gap + firstGutterWidth / 2,
			secondAnchorOffset: gap * 3 + firstGutterWidth + secondGutterWidth / 2
		};
	}

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

	function registerSplitContainer(node) {
		splitContainer = node;
		return {
			destroy() {
				if (splitContainer === node) splitContainer = undefined;
			}
		};
	}

	function openFile() {
		document.getElementById('binary-file-input')?.click();
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
		const gutterRect = event.currentTarget.getBoundingClientRect();
		dragOffset = event.clientX - (gutterRect.left + gutterRect.width / 2);
		activeHandle = handle;
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function stopResize() {
		activeHandle = null;
		dragOffset = 0;
	}

	function handlePointerMove(event) {
		if (!activeHandle || !splitContainer) return;

		const metrics = getSplitMetrics();
		if (!metrics) return;

		const pointerCenterX = event.clientX - dragOffset - metrics.rect.left;

		if (activeHandle === 'first') {
			const ratio = (pointerCenterX - metrics.firstAnchorOffset) / metrics.paneTrackWidth;
			firstSplit = clamp(ratio, minPaneRatio, secondSplit - minPaneRatio);
			return;
		}

		if (activeHandle === 'second') {
			const ratio = (pointerCenterX - metrics.secondAnchorOffset) / metrics.paneTrackWidth;
			secondSplit = clamp(ratio, firstSplit + minPaneRatio, 1 - minPaneRatio);
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
			id="binary-file-input"
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
				<li>
					<button type="button" class="dropdown-item" onclick={openFile}
						><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
							><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
								d="M88 289.6L64.4 360.2L64.4 160C64.4 124.7 93.1 96 128.4 96L267.1 96C280.9 96 294.4 100.5 305.5 108.8L343.9 137.6C349.4 141.8 356.2 144 363.1 144L480.4 144C515.7 144 544.4 172.7 544.4 208L544.4 224L179 224C137.7 224 101 250.4 87.9 289.6zM509.8 512L131 512C98.2 512 75.1 479.9 85.5 448.8L133.5 304.8C140 285.2 158.4 272 179 272L557.8 272C590.6 272 613.7 304.1 603.3 335.2L555.3 479.2C548.8 498.8 530.4 512 509.8 512z"
							/></svg
						>
						Öffnen</button
					>
				</li>
				<li>
					<button type="button" class="dropdown-item" onclick={saveFile}
						><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
							><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
								d="M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 237.3C544 220.3 537.3 204 525.3 192L448 114.7C436 102.7 419.7 96 402.7 96L160 96zM192 192C192 174.3 206.3 160 224 160L384 160C401.7 160 416 174.3 416 192L416 256C416 273.7 401.7 288 384 288L224 288C206.3 288 192 273.7 192 256L192 192zM320 352C355.3 352 384 380.7 384 416C384 451.3 355.3 480 320 480C284.7 480 256 451.3 256 416C256 380.7 284.7 352 320 352z"
							/></svg
						>
						Speichern</button
					>
				</li>
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
		use:registerSplitContainer
		style={`--w1:${firstSplit * 100}%; --w2:${(secondSplit - firstSplit) * 100}%; --w3:${(1 - secondSplit) * 100}%;`}
	>
		<div class="pane pane-binary">
			<BinaryView
				{bytes}
				{hoveredByteRange}
				{setHover}
				{updateBytes}
				onTextAreaHeightChange={handleTextAreaHeightChange}
			/>
		</div>

		<div
			class="gutter"
			type="button"
			role="separator"
			aria-orientation="vertical"
			aria-label="Breite zwischen Binaer und Hex anpassen"
			onpointerdown={(event) => startResize('first', event)}
		></div>

		<div class="pane pane-hex">
			<HexView {bytes} {hoveredByteRange} {setHover} {updateBytes} {textAreaHeight} />
		</div>

		<div
			class="gutter"
			type="button"
			role="separator"
			aria-orientation="vertical"
			aria-label="Breite zwischen Hex und Text anpassen"
			onpointerdown={(event) => startResize('second', event)}
		></div>

		<div class="pane pane-text">
			<TextView
				{bytes}
				{hoveredByteRange}
				{setHover}
				{updateBytes}
				{encoding}
				{setEncoding}
				{textAreaHeight}
			/>
		</div>
	</section>
</main>

<style>
	.dropdown-menu li button svg {
		height: 20px;
	}

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
		flex: 0 0 8px;
		cursor: col-resize;
		border-radius: 999px;
		background: #d9e2ee;
		user-select: none;
		touch-action: none;
	}

	.gutter:hover,
	.gutter:focus {
		outline: none;
		background: #b5c7de;
	}

	@media (max-width: 700px) {
		.grid {
			flex-direction: column;
		}

		.gutter {
			display: none;
		}
	}
</style>
