export function bytesToBinaryText(bytes) {
	return Array.from(bytes, (byte) => byte.toString(2).padStart(8, '0')).join(' ');
}

export function parseBinaryText(text) {
	const bits = (text.match(/[01]/g) || []).join('');
	const byteCount = Math.floor(bits.length / 8);
	const result = new Uint8Array(byteCount);

	for (let i = 0; i < byteCount; i += 1) {
		const chunk = bits.slice(i * 8, i * 8 + 8);
		result[i] = Number.parseInt(chunk, 2);
	}

	return result;
}

export function binaryCharIndexToByteIndex(text, charIndex) {
	if (charIndex < 0 || charIndex >= text.length) return null;
	const char = text[charIndex];
	if (char !== '0' && char !== '1') return null;

	let bitPos = 0;
	for (let i = 0; i <= charIndex; i += 1) {
		const c = text[i];
		if (c === '0' || c === '1') bitPos += 1;
	}

	return Math.floor((bitPos - 1) / 8);
}

export function bytesToHexText(bytes) {
	return Array.from(bytes, (byte) => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

export function parseHexText(text) {
	const hexDigits = (text.match(/[0-9a-fA-F]/g) || []).join('');
	const byteCount = Math.floor(hexDigits.length / 2);
	const result = new Uint8Array(byteCount);

	for (let i = 0; i < byteCount; i += 1) {
		const chunk = hexDigits.slice(i * 2, i * 2 + 2);
		result[i] = Number.parseInt(chunk, 16);
	}

	return result;
}

function countMatchingCharsBeforeIndex(text, endIndex, matcher) {
	let count = 0;
	for (let i = 0; i < endIndex; i += 1) {
		if (matcher.test(text[i])) count += 1;
	}
	return count;
}

function formatGroupedChars(chars, groupSize) {
	let grouped = '';
	for (let i = 0; i < chars.length; i += 1) {
		grouped += chars[i];
		if ((i + 1) % groupSize === 0) grouped += ' ';
	}
	return grouped;
}

function caretFromMeaningfulCount(meaningfulCount, groupSize) {
	return meaningfulCount + Math.floor(meaningfulCount / groupSize);
}

export function formatBinaryInput(rawText, caretIndex) {
	const bitMatcher = /[01]/;
	const bits = (rawText.match(/[01]/g) || []).join('');
	const bitsBeforeCaret = countMatchingCharsBeforeIndex(rawText, caretIndex, bitMatcher);
	const formattedText = formatGroupedChars(bits, 8);
	const nextCaret = Math.min(caretFromMeaningfulCount(bitsBeforeCaret, 8), formattedText.length);

	return { formattedText, nextCaret };
}

export function formatHexInput(rawText, caretIndex) {
	const hexMatcher = /[0-9a-fA-F]/;
	const hex = (rawText.match(/[0-9a-fA-F]/g) || []).join('').toUpperCase();
	const hexBeforeCaret = countMatchingCharsBeforeIndex(rawText, caretIndex, hexMatcher);
	const formattedText = formatGroupedChars(hex, 2);
	const nextCaret = Math.min(caretFromMeaningfulCount(hexBeforeCaret, 2), formattedText.length);

	return { formattedText, nextCaret };
}

export function hexCharIndexToByteIndex(text, charIndex) {
	if (charIndex < 0 || charIndex >= text.length) return null;
	const char = text[charIndex];
	if (!/[0-9a-fA-F]/.test(char)) return null;

	let nibblePos = 0;
	for (let i = 0; i <= charIndex; i += 1) {
		if (/[0-9a-fA-F]/.test(text[i])) nibblePos += 1;
	}

	return Math.floor((nibblePos - 1) / 2);
}

export function bytesToTextAndMap(bytes, encoding = 'utf-8') {
	const normalizedEncoding = encoding.toLowerCase();

	if (normalizedEncoding === 'ascii' || normalizedEncoding === 'iso-8859-1') {
		let text = '';
		const map = [];

		for (let i = 0; i < bytes.length; i += 1) {
			const byte = bytes[i];
			const char =
				normalizedEncoding === 'ascii'
					? byte <= 0x7f
						? String.fromCharCode(byte)
						: '\uFFFD'
					: String.fromCharCode(byte);

			const charStart = text.length;
			text += char;
			const charEnd = text.length;

			map.push({
				byteStart: i,
				byteLength: 1,
				charStart,
				charEnd
			});
		}

		return { text, map };
	}

	const decoder = new TextDecoder('utf-8', { fatal: false });
	let text = '';
	const map = [];
	let i = 0;

	while (i < bytes.length) {
		const firstByte = bytes[i];
		let length = 1;

		if ((firstByte & 0x80) === 0) length = 1;
		else if ((firstByte & 0xe0) === 0xc0) length = 2;
		else if ((firstByte & 0xf0) === 0xe0) length = 3;
		else if ((firstByte & 0xf8) === 0xf0) length = 4;

		const actualLength = Math.min(length, bytes.length - i);
		const slice = bytes.subarray(i, i + actualLength);
		const decoded = decoder.decode(slice);
		const char = decoded || '\uFFFD';
		const charStart = text.length;
		text += char;
		const charEnd = text.length;

		map.push({
			byteStart: i,
			byteLength: actualLength,
			charStart,
			charEnd
		});

		i += actualLength;
	}

	return { text, map };
}

export function parseText(text, encoding = 'utf-8') {
	const normalizedEncoding = encoding.toLowerCase();

	if (normalizedEncoding === 'utf-8') {
		return new TextEncoder().encode(text);
	}

	if (normalizedEncoding === 'iso-8859-1') {
		return Uint8Array.from(
			Array.from(text, (char) => {
				const codePoint = char.codePointAt(0) ?? 0x3f;
				return codePoint <= 0xff ? codePoint : 0x3f;
			})
		);
	}

	if (normalizedEncoding === 'ascii') {
		return Uint8Array.from(
			Array.from(text, (char) => {
				const codePoint = char.codePointAt(0) ?? 0x3f;
				return codePoint <= 0x7f ? codePoint : 0x3f;
			})
		);
	}

	return new TextEncoder().encode(text);
}

export function bytesToUtf8TextAndMap(bytes) {
	return bytesToTextAndMap(bytes, 'utf-8');
}

export function parseUtf8Text(text) {
	return parseText(text, 'utf-8');
}

export function textCharIndexToByteRange(map, charIndex) {
	for (const token of map) {
		if (charIndex >= token.charStart && charIndex < token.charEnd) {
			return { start: token.byteStart, length: token.byteLength };
		}
	}

	return null;
}

export function buildHighlightSetFromByteRange(text, charIndexToByteIndex, byteRange) {
	const indices = new Set();
	if (!byteRange) return indices;

	const rangeStart = byteRange.start;
	const rangeEnd = byteRange.start + byteRange.length;

	for (let i = 0; i < text.length; i += 1) {
		const byteIndex = charIndexToByteIndex(text, i);
		if (byteIndex === null) continue;
		if (byteIndex >= rangeStart && byteIndex < rangeEnd) indices.add(i);
	}

	return indices;
}

export function buildTextHighlightSetFromByteRange(text, map, byteRange) {
	const indices = new Set();
	if (!byteRange) return indices;

	const rangeStart = byteRange.start;
	const rangeEnd = byteRange.start + byteRange.length;

	for (const token of map) {
		const tokenStart = token.byteStart;
		const tokenEnd = token.byteStart + token.byteLength;
		const overlaps = tokenStart < rangeEnd && tokenEnd > rangeStart;
		if (!overlaps) continue;

		for (let i = token.charStart; i < token.charEnd; i += 1) {
			indices.add(i);
		}
	}

	return indices;
}

export function textToSegments(text, highlightedIndices) {
	if (!text) return [];

	const segments = [];
	let start = 0;
	let prevHighlighted = highlightedIndices.has(0);

	for (let i = 1; i <= text.length; i += 1) {
		const currentHighlighted = i < text.length ? highlightedIndices.has(i) : !prevHighlighted;
		if (i === text.length || currentHighlighted !== prevHighlighted) {
			segments.push({
				text: text.slice(start, i),
				highlighted: prevHighlighted
			});
			start = i;
			prevHighlighted = currentHighlighted;
		}
	}

	return segments;
}

export function getFirstHighlightedIndex(highlightedIndices) {
	if (!highlightedIndices || highlightedIndices.size === 0) return null;

	let first = null;
	for (const index of highlightedIndices) {
		if (first === null || index < first) first = index;
	}

	return first;
}

function getTypographyMetrics(element) {
	const styles = getComputedStyle(element);
	const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
	const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
	const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
	const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
	const lineHeight = Number.parseFloat(styles.lineHeight) || 20;
	const font = styles.font || `${styles.fontSize} ${styles.fontFamily}`;

	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) return null;
	context.font = font;

	const charWidth = context.measureText('0').width || 8;
	const usableWidth = Math.max(1, element.clientWidth - paddingLeft - paddingRight);
	const charsPerRow = Math.max(1, Math.floor(usableWidth / charWidth));

	return {
		paddingLeft,
		paddingRight,
		paddingTop,
		paddingBottom,
		lineHeight,
		charWidth,
		charsPerRow
	};
}

function getVisualPositionFromIndex(text, charIndex, charsPerRow) {
	const lines = text.split('\n');
	let absoluteStart = 0;
	let row = 0;

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const lineLength = line.length;

		if (charIndex <= absoluteStart + lineLength) {
			const local = Math.max(0, charIndex - absoluteStart);
			row += Math.floor(local / charsPerRow);
			const col = local % charsPerRow;
			return { row, col };
		}

		const visualRowsForLine = Math.max(1, Math.ceil(lineLength / charsPerRow));
		row += visualRowsForLine;
		absoluteStart += lineLength + 1;
	}

	return null;
}

export function ensureCharVisible(element, text, charIndex) {
	if (!element || !text || charIndex === null || charIndex < 0 || charIndex >= text.length) return;

	const metrics = getTypographyMetrics(element);
	if (!metrics) return;

	const pos = getVisualPositionFromIndex(text, charIndex, metrics.charsPerRow);
	if (!pos) return;

	const x = metrics.paddingLeft + pos.col * metrics.charWidth;
	const y = metrics.paddingTop + pos.row * metrics.lineHeight;

	const viewLeft = element.scrollLeft + metrics.paddingLeft;
	const viewRight = element.scrollLeft + element.clientWidth - metrics.paddingRight;
	const viewTop = element.scrollTop + metrics.paddingTop;
	const viewBottom = element.scrollTop + element.clientHeight - metrics.paddingBottom;

	if (x < viewLeft) {
		element.scrollLeft = Math.max(0, x - metrics.paddingLeft);
	} else if (x + metrics.charWidth > viewRight) {
		element.scrollLeft = Math.max(
			0,
			x + metrics.charWidth - (element.clientWidth - metrics.paddingRight)
		);
	}

	if (y < viewTop) {
		element.scrollTop = Math.max(0, y - metrics.paddingTop);
	} else if (y + metrics.lineHeight > viewBottom) {
		element.scrollTop = Math.max(
			0,
			y + metrics.lineHeight - (element.clientHeight - metrics.paddingBottom)
		);
	}
}

export function getCharIndexFromMouse(event, element, text) {
	if (!text.length) return null;

	const rect = element.getBoundingClientRect();
	const metrics = getTypographyMetrics(element);
	if (!metrics) return null;

	const x = event.clientX - rect.left + element.scrollLeft - metrics.paddingLeft;
	const y = event.clientY - rect.top + element.scrollTop - metrics.paddingTop;

	if (x < 0 || y < 0) return null;

	const row = Math.floor(y / metrics.lineHeight);
	const col = Math.floor(x / metrics.charWidth);

	const visualRows = [];
	let absoluteStart = 0;
	const lines = text.split('\n');

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];

		if (line.length === 0) {
			visualRows.push({ start: absoluteStart, length: 0 });
		} else {
			for (let offset = 0; offset < line.length; offset += metrics.charsPerRow) {
				const length = Math.min(metrics.charsPerRow, line.length - offset);
				visualRows.push({ start: absoluteStart + offset, length });
			}
		}

		absoluteStart += line.length;
		if (i < lines.length - 1) absoluteStart += 1;
	}

	if (row < 0 || row >= visualRows.length) return null;
	const visualRow = visualRows[row];
	if (col < 0 || col >= visualRow.length) return null;

	return visualRow.start + col;
}
