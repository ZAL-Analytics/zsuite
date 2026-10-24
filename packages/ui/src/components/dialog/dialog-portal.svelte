<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { dialogHost } from "./host.svelte.js";

	let { to, ...restProps }: DialogPrimitive.PortalProps = $props();
</script>

<DialogPrimitive.Portal to={to ?? dialogHost.to ?? undefined} {...restProps} />
