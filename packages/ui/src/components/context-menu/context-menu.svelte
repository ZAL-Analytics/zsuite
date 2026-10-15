<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { direction } from "../../direction.svelte.js";

	let { open = $bindable(false), ...restProps }: ContextMenuPrimitive.RootProps = $props();
</script>

<ContextMenuPrimitive.Root bind:open dir={direction.value} {...restProps} />
