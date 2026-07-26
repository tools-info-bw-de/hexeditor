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

	let { bytes, hoveredByteRange, setHover, updateBytes, encoding, textAreaHeight = 0 } = $props();

	let mapped = $derived(bytesToTextAndMap(bytes, encoding));
	let text = $state('');
	let isFocused = $state(false);
	let map = $derived(mapped.map);
	let editBytes = new Uint8Array([]);
	let editorEl = $state();
	let overlayEl = $state();

	$effect(() => {
		if (!isFocused) {
			text = mapped.text;
		}
	});

	$effect(() => {
		editBytes = bytes;
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
		const target = event.currentTarget;
		const rawText = target.value;
		const rawCaret = target.selectionStart ?? rawText.length;
		const { text: nextText, caret: nextCaret } = sanitizeByEncoding(rawText, rawCaret, encoding);

		if (nextText !== rawText) {
			target.value = nextText;
			target.setSelectionRange(nextCaret, nextCaret);
		}

		if (encoding === 'ascii') {
			const nextBytes = parseAsciiWithStableInvalidBytes(text, nextText, editBytes);
			editBytes = nextBytes;
			updateBytes(nextBytes);
			text = nextText;
			return;
		}

		const nextBytes = parseText(nextText, encoding);
		editBytes = nextBytes;
		text = nextText;
		updateBytes(nextBytes);
	}

	function sanitizeByEncoding(input, caret, activeEncoding) {
		if (activeEncoding === 'utf-8') {
			return { text: input, caret };
		}

		let output = '';
		let outputCaret = 0;
		let inputOffset = 0;

		for (const char of input) {
			const charLength = char.length;
			const codePoint = char.codePointAt(0) ?? 0;
			const allowed = activeEncoding === 'ascii' ? codePoint <= 0x7f : codePoint <= 0xff;

			if (allowed) {
				output += char;
				if (inputOffset + charLength <= caret) {
					outputCaret += charLength;
				}
			}

			inputOffset += charLength;
		}

		return { text: output, caret: outputCaret };
	}

	function parseAsciiWithStableInvalidBytes(previousText, nextText, currentBytes) {
		if (!previousText.length) return parseText(nextText, 'ascii');

		const previousLength = previousText.length;
		const nextLength = nextText.length;

		let prefix = 0;
		const maxPrefix = Math.min(previousLength, nextLength);
		while (prefix < maxPrefix && previousText[prefix] === nextText[prefix]) {
			prefix += 1;
		}

		let suffix = 0;
		while (
			suffix < previousLength - prefix &&
			suffix < nextLength - prefix &&
			previousText[previousLength - 1 - suffix] === nextText[nextLength - 1 - suffix]
		) {
			suffix += 1;
		}

		const middleText = nextText.slice(prefix, nextLength - suffix);
		const middleBytes = parseText(middleText, 'ascii');

		const prefixBytes = currentBytes.slice(0, prefix);
		const suffixStart = Math.max(prefix, previousLength - suffix);
		const suffixBytes = currentBytes.slice(suffixStart);

		const merged = new Uint8Array(prefixBytes.length + middleBytes.length + suffixBytes.length);
		merged.set(prefixBytes, 0);
		merged.set(middleBytes, prefixBytes.length);
		merged.set(suffixBytes, prefixBytes.length + middleBytes.length);

		return merged;
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
			value={text}
			style={textAreaHeight > 0 ? `height: ${textAreaHeight}px;` : undefined}
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

	:global(html[data-bs-theme='dark']) .overlay {
		background: #2c4768 !important;
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
		font-size: 1.4rem;
		font-weight: 700;
		text-align: center;
	}

	.editor-wrap {
		position: relative;
		/* min-height: 400px; */
	}

	.overlay,
	textarea {
		width: 229.583px !important;
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
	}

	@media (max-width: 750px) {
		.overlay,
		textarea {
			min-width: 100%;
			max-width: 100%;
			min-height: 250px !important;
			max-height: 250px;
		}
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
		resize: none;
	}

	.highlighted {
		background: #ffe69c;
		color: #1d2a3a;
	}

	:global(html[data-bs-theme='dark']) .highlighted {
		background-color: #1d2a3a;
	}
</style>
