<script>
	import {
		buildRangeSegments,
		bytesToTextAndMap,
		ensureCharVisible,
		findCharRangeForByteRange,
		getCharIndexFromMouse,
		parseText,
		textCharIndexToByteRange
	} from '$lib/byte-editor';

	let { bytes, hoveredByteRange, setHover, updateBytes, encoding } = $props();

	let mapped = $derived(bytesToTextAndMap(bytes, encoding));
	let text = $state('');
	let isFocused = $state(false);
	let map = $derived(mapped.map);
	let editorEl = $state();
	let overlayEl = $state();

	$effect(() => {
		if (!isFocused) {
			text = mapped.text;
		}
	});

	let highlightRange = $derived(findCharRangeForByteRange(map, hoveredByteRange));
	let segments = $derived(
		buildRangeSegments(text, highlightRange?.start ?? null, highlightRange?.endExclusive ?? null)
	);

	$effect(() => {
		if (!highlightRange || !editorEl) return;

		ensureCharVisible(editorEl, text, highlightRange.start);
		syncScroll();
	});

	function handleInput(event) {
		text = event.currentTarget.value;
		updateBytes(parseText(text, encoding));
	}

	function handleMouseMove(event) {
		const charIndex = getCharIndexFromMouse(event, editorEl, text);
		if (charIndex === null) {
			setHover(null, 0);
			return;
		}

		const byteRange = textCharIndexToByteRange(map, charIndex);
		if (!byteRange) {
			setHover(null, 0);
			return;
		}

		if (
			hoveredByteRange?.start === byteRange.start &&
			hoveredByteRange?.length === byteRange.length
		)
			return;

		setHover(byteRange.start, byteRange.length);
	}

	function clearHover() {
		if (!hoveredByteRange) return;
		setHover(null, 0);
	}

	function syncScroll() {
		if (!editorEl || !overlayEl) return;
		overlayEl.scrollLeft = editorEl.scrollLeft;
		overlayEl.scrollTop = editorEl.scrollTop;
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		isFocused = false;
		text = mapped.text;
	}
</script>

<section class="panel">
	<h2>Text</h2>

	<div class="editor-wrap">
		<pre
			class="overlay"
			bind:this={overlayEl}
			aria-hidden="true">{#each segments as segment, index (index)}<span
					class:highlighted={segment.highlighted}>{segment.text}</span
				>{/each}</pre>
		<textarea
			class="form-control"
			bind:this={editorEl}
			bind:value={text}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onmousemove={handleMouseMove}
			onmouseleave={clearHover}
			onscroll={syncScroll}
			spellcheck="false"
			wrap="soft"
			aria-label="Text editor"></textarea>
	</div>
</section>

<style>
	.overlay {
		background: #cff5ff !important;
	}

	textarea:focus {
		background: transparent;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}

	.editor-wrap {
		position: relative;
		min-height: 400px;
	}

	.overlay,
	textarea {
		box-sizing: border-box;
		font-family: 'Fira Code', 'JetBrains Mono', monospace;
		font-variant-ligatures: none;
		font-feature-settings:
			'liga' 0,
			'calt' 0;
		letter-spacing: 0;
		tab-size: 1;
		text-rendering: geometricPrecision;
		font-size: 0.95rem;
		line-height: 1.5;
		padding: 0.75rem;
		border: 1px solid #c6d0dd;
		border-radius: 0.65rem;
		white-space: pre-wrap;
		word-break: break-all;
		overflow-wrap: anywhere;
		overflow-x: hidden;
		overflow-y: auto;
		scrollbar-gutter: stable both-edges;
	}

	.overlay {
		position: absolute;
		inset: 0;
		margin: 0;
		pointer-events: none;
		background: #f5f8fc;
		color: transparent;
	}

	textarea {
		position: relative;
		z-index: 1;
		width: 100%;
		height: 18rem;
		min-height: 400px;
		background: transparent;
		color: #1d2a3a;
		caret-color: #1d2a3a;
		resize: vertical;
	}

	.highlighted {
		background: #ffe69c;
		color: #1d2a3a;
	}
</style>
