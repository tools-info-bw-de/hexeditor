<script>
	import {
		binaryCharIndexToByteIndex,
		buildRangeSegments,
		bytesToBinaryText,
		ensureCharVisible,
		formatBinaryInput,
		getCharIndexFromMouse,
		parseBinaryText
	} from '$lib/byte-editor';

	let { bytes, hoveredByteRange, setHover, updateBytes } = $props();

	let text = $state('');
	let isFocused = $state(false);
	let editorEl = $state();
	let overlayEl = $state();

	$effect(() => {
		if (!isFocused) {
			text = bytesToBinaryText(bytes);
		}
	});

	let highlightRange = $derived(
		hoveredByteRange && hoveredByteRange.length > 0
			? {
					start: hoveredByteRange.start * 9,
					endExclusive: (hoveredByteRange.start + hoveredByteRange.length - 1) * 9 + 8
				}
			: null
	);
	let segments = $derived(
		buildRangeSegments(text, highlightRange?.start ?? null, highlightRange?.endExclusive ?? null)
	);

	$effect(() => {
		if (!highlightRange || !editorEl) return;

		ensureCharVisible(editorEl, text, highlightRange.start);
		syncScroll();
	});

	function handleInput(event) {
		const target = event.currentTarget;
		const caretIndex = target.selectionStart ?? target.value.length;
		const { formattedText, nextCaret } = formatBinaryInput(target.value, caretIndex);

		text = formattedText;
		updateBytes(parseBinaryText(formattedText));

		target.value = formattedText;
		target.setSelectionRange(nextCaret, nextCaret);
	}

	function handleMouseMove(event) {
		const charIndex = getCharIndexFromMouse(event, editorEl, text);
		if (charIndex === null) {
			setHover(null, 0);
			return;
		}

		const byteIndex = binaryCharIndexToByteIndex(text, charIndex);
		if (byteIndex === null) {
			setHover(null, 0);
			return;
		}

		if (hoveredByteRange?.start === byteIndex && hoveredByteRange?.length === 1) return;

		setHover(byteIndex, 1);
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
		text = bytesToBinaryText(bytes);
	}
</script>

<section class="panel">
	<h2>Binary</h2>
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
			aria-label="Binary editor"></textarea>
	</div>
</section>

<style>
	.overlay {
		background: #d1fad1 !important;
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
