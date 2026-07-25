<script>
	import {
		buildTextHighlightSetFromByteRange,
		bytesToTextAndMap,
		ensureCharVisible,
		getFirstHighlightedIndex,
		getCharIndexFromMouse,
		parseText,
		textCharIndexToByteRange,
		textToSegments
	} from '$lib/byte-editor';

	let { bytes, hoveredByteRange, setHover, updateBytes, encoding, setEncoding } = $props();

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

	let highlightedIndices = $derived(
		buildTextHighlightSetFromByteRange(text, map, hoveredByteRange)
	);
	let segments = $derived(textToSegments(text, highlightedIndices));

	$effect(() => {
		const firstHighlightedIndex = getFirstHighlightedIndex(highlightedIndices);
		if (firstHighlightedIndex === null || !editorEl) return;

		ensureCharVisible(editorEl, text, firstHighlightedIndex);
		syncScroll();
	});

	function handleInput(event) {
		text = event.currentTarget.value;
		updateBytes(parseText(text, encoding));
	}

	function handleEncodingChange(event) {
		setEncoding(event.currentTarget.value);
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

		setHover(byteRange.start, byteRange.length);
	}

	function clearHover() {
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
	<label class="encoding">
		<span>Encoding</span>
		<select value={encoding} onchange={handleEncodingChange} aria-label="Text encoding">
			<option value="utf-8">UTF-8</option>
			<option value="iso-8859-1">ISO-8859-1</option>
			<option value="ascii">ASCII</option>
		</select>
	</label>
	<div class="editor-wrap">
		<pre
			class="overlay"
			bind:this={overlayEl}
			aria-hidden="true">{#each segments as segment, index (index)}<span
					class:highlighted={segment.highlighted}>{segment.text}</span
				>{/each}</pre>
		<textarea
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
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.encoding {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.encoding select {
		font: inherit;
		padding: 0.25rem 0.45rem;
		border: 1px solid #c6d0dd;
		border-radius: 0.5rem;
		background: #fff;
		color: #1d2a3a;
	}

	h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}

	.editor-wrap {
		position: relative;
		min-height: 16rem;
	}

	.overlay,
	textarea {
		box-sizing: border-box;
		font-family: 'Fira Code', 'JetBrains Mono', monospace;
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
