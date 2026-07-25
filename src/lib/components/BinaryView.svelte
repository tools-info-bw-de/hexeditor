<script>
	let { bytes, hoveredByteRange, setHover, updateBytes } = $props();

	function handleBlur(content, event) {
		console.log(content, event);
	}

	let bytesText = $derived(bytes.map((byte) => byte.toString(2).padStart(8, '0')));
</script>

<div class="text-grid">
	{#each bytesText as byte, index (index)}
		<span
			role="textbox"
			tabindex="0"
			class:highlighted={index < hoveredByteRange?.start + hoveredByteRange?.length &&
				index >= hoveredByteRange?.start}
			onmouseenter={() => (hoveredByteRange = { start: index, length: 1 })}
			onmouseleave={() => (hoveredByteRange = null)}
			contenteditable="true"
			bind:innerHTML={bytesText[index]}
			oninput={(e) => handleBlur(byte, e)}
		>
			<!-- {byte.toString(2).padStart(8, '0')} -->
		</span>
	{/each}
</div>

<style>
	span {
		margin-right: 10px;
	}
</style>
