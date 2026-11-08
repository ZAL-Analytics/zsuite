<script lang="ts">
  import { ColorDot } from "@zsuite/ui/color-dot";

  let color = $state("#3b82f6");
</script>

<div class="flex items-center gap-3 text-sm">
  <ColorDot value={color} onchange={(value) => (color = value)} aria-label="Colour" />
  <ColorDot size="sm" value={color} onchange={(value) => (color = value)} aria-label="Colour, small" />
  <span class="font-mono">{color}</span>
</div>
