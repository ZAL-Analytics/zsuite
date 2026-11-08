<script lang="ts">
	import { cn } from "../../utils.js";
	import { isImageUrl, lookOf } from "./avatars.js";
	import CharacterArt from "./character-art.svelte";

	let {
		avatar,
		name,
		size = "md",
		isImage = isImageUrl,
		class: className,
	}: {
		/** `preset:<key>` for a drawn character, a picture URL, or anything else for initials. */
		avatar: string;
		name: string;
		size?: "sm" | "md" | "lg" | "xl";
		isImage?: (avatar: string) => boolean;
		class?: string;
	} = $props();

	const look = $derived(lookOf(avatar, name, isImage));
	const sizes = { sm: "size-6 text-[0.6rem]", md: "size-8 text-xs", lg: "size-12 text-base", xl: "size-20 text-xl" };
</script>

<span
	data-slot="avatar"
	class={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-medium text-secondary-foreground", sizes[size], className)}
	title={name}
	role="img"
	aria-label={name}
>
	{#if look.kind === "character"}
		<CharacterArt character={look.character} />
	{:else if look.kind === "image"}
		<img src={look.src} alt="" class="size-full object-cover" />
	{:else}
		{look.text}
	{/if}
</span>
