<script>
	import {
		buildHighlightSetFromByteRange,
		bytesToHexText,
		ensureCharVisible,
		formatHexInput,
		getFirstHighlightedIndex,
		getCharIndexFromMouse,
		hexCharIndexToByteIndex,
		parseHexText,
		textToSegments
	} from '$lib/byte-editor';

	let { bytes, hoveredByteRange, setHover, updateBytes } = $props();

	let text = $state('');
	let isFocused = $state(false);
	let editorEl = $state();
	let overlayEl = $state();

	$effect(() => {
		if (!isFocused) {
			text = bytesToHexText(bytes);
		}
	});

	let highlightedIndices = $derived(
		buildHighlightSetFromByteRange(text, hexCharIndexToByteIndex, hoveredByteRange)
	);
	let segments = $derived(textToSegments(text, highlightedIndices));

	$effect(() => {
		const firstHighlightedIndex = getFirstHighlightedIndex(highlightedIndices);
		if (firstHighlightedIndex === null || !editorEl) return;

		ensureCharVisible(editorEl, text, firstHighlightedIndex);
		syncScroll();
	});

	function handleInput(event) {
		const target = event.currentTarget;
		const caretIndex = target.selectionStart ?? target.value.length;
		const { formattedText, nextCaret } = formatHexInput(target.value, caretIndex);

		text = formattedText;
		updateBytes(parseHexText(formattedText));

		target.value = formattedText;
		target.setSelectionRange(nextCaret, nextCaret);
	}

	function handleMouseMove(event) {
		const charIndex = getCharIndexFromMouse(event, editorEl, text);
		if (charIndex === null) {
			setHover(null, 0);
			return;
		}

		const byteIndex = hexCharIndexToByteIndex(text, charIndex);
		if (byteIndex === null) {
			setHover(null, 0);
			return;
		}

		setHover(byteIndex, 1);
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
		text = bytesToHexText(bytes);
	}
</script>

<section class="panel">
	<h2>Hex</h2>
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
			aria-label="Hex editor"></textarea>
	</div>
</section>

<style>
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
