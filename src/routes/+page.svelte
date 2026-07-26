<script>
	import BinaryView from '$lib/components/BinaryView.svelte';
	import HexView from '$lib/components/HexView.svelte';
	import TextView from '$lib/components/TextView.svelte';
	import { onMount } from 'svelte';

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
	let theme = $state('light');
	let isThemeManual = $state(false);

	function resolveSystemTheme() {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function applyTheme(nextTheme) {
		theme = nextTheme;
		document.documentElement.setAttribute('data-bs-theme', nextTheme);
	}

	function handleThemeSwitch(event) {
		isThemeManual = true;
		applyTheme(event.currentTarget.checked ? 'dark' : 'light');
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleSystemThemeChange = () => {
			if (isThemeManual) return;
			applyTheme(mediaQuery.matches ? 'dark' : 'light');
		};

		isThemeManual = false;
		applyTheme(resolveSystemTheme());

		if (typeof mediaQuery.addEventListener === 'function') {
			mediaQuery.addEventListener('change', handleSystemThemeChange);
			return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
		}

		mediaQuery.addListener(handleSystemThemeChange);
		return () => mediaQuery.removeListener(handleSystemThemeChange);
	});

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

<div class="top-right">
	<div class="theme-toggle-row">
		<div class="theme-toggle-wrap">
			<svg
				class="theme-icon"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 640 640"
				aria-hidden="true"
				><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
					d="M320 32C328.4 32 336.3 36.4 340.6 43.7L396.1 136.3L500.9 110C509.1 108 517.8 110.4 523.7 116.3C529.6 122.2 532 131 530 139.1L503.7 243.8L596.4 299.3C603.6 303.6 608.1 311.5 608.1 319.9C608.1 328.3 603.7 336.2 596.4 340.5L503.7 396.1L530 500.8C532 509 529.6 517.7 523.7 523.6C517.8 529.5 509 532 500.9 530L396.2 503.7L340.7 596.4C336.4 603.6 328.5 608.1 320.1 608.1C311.7 608.1 303.8 603.7 299.5 596.4L243.9 503.7L139.2 530C131 532 122.4 529.6 116.4 523.7C110.4 517.8 108 509 110 500.8L136.2 396.1L43.6 340.6C36.4 336.2 32 328.4 32 320C32 311.6 36.4 303.7 43.7 299.4L136.3 243.9L110 139.1C108 130.9 110.3 122.3 116.3 116.3C122.3 110.3 131 108 139.2 110L243.9 136.2L299.4 43.6L301.2 41C305.7 35.3 312.6 31.9 320 31.9zM320 176C240.5 176 176 240.5 176 320C176 399.5 240.5 464 320 464C399.5 464 464 399.5 464 320C464 240.5 399.5 176 320 176zM320 416C267 416 224 373 224 320C224 267 267 224 320 224C373 224 416 267 416 320C416 373 373 416 320 416z"
				/>
			</svg>

			<div class="form-check form-switch m-0">
				<input
					id="theme-switch"
					type="checkbox"
					class="form-check-input"
					role="switch"
					checked={theme === 'dark'}
					onchange={handleThemeSwitch}
					aria-label="Dark mode umschalten"
				/>
			</div>

			<svg class="theme-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"
				><!--!Font Awesome Free v7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path
					d="M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C388.8 576 451.3 548.8 497.3 504.6C504.6 497.6 506.7 486.7 502.6 477.5C498.5 468.3 488.9 462.6 478.8 463.4C473.9 463.8 469 464 464 464C362.4 464 280 381.6 280 280C280 207.9 321.5 145.4 382.1 115.2C391.2 110.7 396.4 100.9 395.2 90.8C394 80.7 386.6 72.5 376.7 70.3C358.4 66.2 339.4 64 320 64z"
				/></svg
			>
		</div>
	</div>
</div>

<main class="app">
	<h1>Hex-Editor</h1>

	<div class="options d-flex my-4">
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
	<section class="d-flex gap-3">
		<div class="pane pane-binary flex-grow-1">
			<BinaryView
				{bytes}
				{hoveredByteRange}
				{setHover}
				{updateBytes}
				onTextAreaHeightChange={handleTextAreaHeightChange}
			/>
		</div>

		<div class="pane pane-hex">
			<HexView {bytes} {hoveredByteRange} {setHover} {updateBytes} {textAreaHeight} />
		</div>

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
	.top-right {
		position: fixed;
		top: 0.5rem;
		right: 0.5rem;
		z-index: 1000;
	}

	.options {
		background: var(--bs-tertiary-bg);
		padding: 0.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 3px 8px rgba(var(--bs-body-color-rgb), 0.14);
	}

	:global(html[data-bs-theme='dark']) .options {
		box-shadow: 0 3px 8px rgba(var(--bs-body-color-rgb), 0.3);
	}

	:global(html[data-bs-theme='dark'] textarea) {
		color: var(--bs-body-color) !important;
		caret-color: var(--bs-body-color) !important;
	}

	.dropdown-menu li button svg {
		height: 20px;
	}

	:global(html[data-bs-theme='dark']) .dropdown-menu li button svg {
		fill: var(--bs-body-color);
	}

	:global([data-bs-theme='dark']) {
		--bs-body-bg: #494949;
		--bs-body-color: #f8f9fa;
	}

	.app {
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		color: var(--bs-body-color);
	}

	.theme-toggle-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.25rem;
	}

	#theme-switch {
		margin-left: 0;
	}

	.form-switch:has(#theme-switch) {
		padding-left: 0;
	}

	.theme-toggle-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.theme-icon {
		width: 1.5rem;
		height: 1.5rem;
		fill: currentColor;
		color: var(--bs-body-color);
		opacity: 0.8;
		flex-shrink: 0;
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
</style>
