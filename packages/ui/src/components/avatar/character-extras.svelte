<svelte:options namespace="svg" />

<script lang="ts">
  import { SHADE } from "./avatars.js";

  let { glasses, headwear, cloth }: { glasses: number; headwear: number; cloth: string } = $props();

  const shade = SHADE;
</script>

{#if glasses === 1}
  <g fill="rgb(255 255 255 / 0.15)" stroke="#2B2F36" stroke-width="1.1">
    <circle cx="27" cy="30.5" r="3.6" /><circle cx="37" cy="30.5" r="3.6" />
    <path d="M30.6 30.3 Q32 29.4 33.4 30.3" fill="none" />
  </g>
{:else if glasses === 2}
  <g fill="rgb(255 255 255 / 0.15)" stroke="#7A4B2A" stroke-width="1.2">
    <rect x="23" y="27.6" width="8" height="5.8" rx="1.6" /><rect x="33" y="27.6" width="8" height="5.8" rx="1.6" />
    <path d="M31 30 Q32 29.3 33 30" fill="none" />
  </g>
{:else if glasses === 3}
  <path d="M20 29 H21 M43 29 H44" stroke="#2B2F36" stroke-width="1.6" />
  <path
    d="M21 28 Q21 26.5 23 26.5 L41 26.5 Q43 26.5 43 28 L43 32.5 Q43 34 41 34 L34 34 Q32 32 30 34 L23 34 Q21 34 21 32.5 Z"
    fill="rgb(191 227 240 / 0.55)"
    stroke="#2E7FA3"
    stroke-width="1"
  />
{:else if glasses === 4}
  <g fill="rgb(255 255 255 / 0.15)" stroke="#34405A" stroke-width="1.1">
    <rect x="23.3" y="27.2" width="7.4" height="6.6" rx="2.9" /><rect x="33.3" y="27.2" width="7.4" height="6.6" rx="2.9" />
    <path d="M30.7 30.2 Q32 29.3 33.3 30.2" fill="none" />
  </g>
{/if}

{#if headwear === 1 || headwear === 2}
  {@const hat = headwear === 1 ? "#F2B705" : "#F3F4F6"}
  <path d="M18 25 Q18 9.5 32 9.5 Q46 9.5 46 25 Z" fill={hat} stroke={shade} stroke-width="0.5" />
  <path d="M30.5 10 H33.5 V24.5 H30.5 Z" fill={shade} opacity="0.5" />
  <path d="M15 25.5 Q32 22.5 49 25.5 L49 27 Q32 24.5 15 27 Z" fill={hat} stroke={shade} stroke-width="0.5" />
{:else if headwear === 3}
  <path d="M19.5 24 Q19.5 12 32 12 Q44.5 12 44.5 24 Z" fill={cloth} />
  <path d="M20 23.5 Q32 21.5 44 23.5 Q44 26.5 32 26 Q20 26.5 20 23.5 Z" fill={cloth} stroke={shade} stroke-width="1" />
  <circle cx="32" cy="12.3" r="1.2" fill={cloth} stroke={shade} stroke-width="0.5" />
{:else if headwear === 4}
  <path d="M19 30 Q18 13 32 13 Q46 13 45 30" fill="none" stroke="#2B2F36" stroke-width="2" />
  <rect x="16.5" y="27" width="5" height="8" rx="2" fill="#2B2F36" />
  <rect x="42.5" y="27" width="5" height="8" rx="2" fill="#2B2F36" />
  <path d="M19 34 Q20 40 27 39" fill="none" stroke="#2B2F36" stroke-width="1.2" />
  <circle cx="27.5" cy="39" r="1.2" fill="#2B2F36" />
{/if}
