<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium [&>svg]:pointer-events-none [&>svg]:size-3",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground border-transparent",
				secondary: "bg-secondary text-secondary-foreground border-transparent",
				destructive: "bg-destructive/10 text-destructive border-transparent dark:bg-destructive/20",
				outline: "text-foreground border-border",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "../../utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> & { variant?: BadgeVariant } = $props();
</script>

<span bind:this={ref} data-slot="badge" class={cn(badgeVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</span>
