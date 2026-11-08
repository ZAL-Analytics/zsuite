<svelte:options namespace="svg" />

<script lang="ts">
  import { SHADE } from "./avatars.js";

  let { outfit, cloth, skin }: { outfit: number; cloth: string; skin: string } = $props();

  const white = "#F5F7FA";
  const shade = SHADE;
  const shoulders = "M12 64 Q12 47 32 47 Q52 47 52 64 Z";
  const checks = "M18 47 V64 M24 47 V64 M40 47 V64 M46 47 V64 M12 53 H52 M12 59 H52";
</script>

{#if outfit === 2 || outfit === 5 || outfit === 15}
  <path d={shoulders} fill={white} stroke="#D5DBE2" stroke-width="0.6" />
{:else}
  <path d={shoulders} fill={cloth} />
{/if}
<rect x="27" y="38" width="10" height="11" rx="3" fill={skin} />
{#if outfit === 0}
  <path d="M26.5 47.4 Q32 52 37.5 47.4" fill="none" stroke={shade} stroke-width="1.2" />
{:else if outfit === 1}
  <path d="M26 47 L32 52 L28.5 55 Z M38 47 L32 52 L35.5 55 Z" fill={cloth} stroke={shade} stroke-width="0.8" />
  <path d="M32 52 V58" stroke={shade} stroke-width="0.8" />
  <circle cx="32" cy="54.5" r="0.6" fill={white} /><circle cx="32" cy="56.8" r="0.6" fill={white} />
{:else if outfit === 2}
  <path d="M26 47 L32 51 L28.5 54 Z M38 47 L32 51 L35.5 54 Z" fill={white} stroke="#C9D0D8" stroke-width="0.6" />
  <path d="M30.6 50.6 L33.4 50.6 L34.6 60 L32 63 L29.4 60 Z" fill={cloth} />
{:else if outfit === 3}
  <path d="M26 47 L32 59 L38 47 Z" fill={white} />
  <path d="M30.8 50 L33.2 50 L34 57 L32 59.5 L30 57 Z" fill="#B23A3A" />
  <path d="M26 47 L31 59 L27 64 M38 47 L33 59 L37 64" fill="none" stroke={shade} stroke-width="1" />
{:else if outfit === 4}
  <path d="M26.5 47 L32 58 L37.5 47 Z" fill="#F7EFE6" />
  <path d="M26.5 47 L31.5 58 L28 64 M37.5 47 L32.5 58 L36 64" fill="none" stroke={shade} stroke-width="1" />
{:else if outfit === 5}
  <path d="M26.5 47 L32 57 L37.5 47 Z" fill={cloth} />
  <path d="M26.5 47 L31.5 57.5 L29 64 M37.5 47 L32.5 57.5 L35 64" fill="none" stroke="#C9D0D8" stroke-width="0.9" />
  <rect x="39" y="55" width="5" height="5" rx="0.5" fill="none" stroke="#C9D0D8" stroke-width="0.7" />
  <path d="M41 53.5 V57" stroke="#3E6FB0" stroke-width="1" stroke-linecap="round" />
{:else if outfit === 6}
  <path d="M25.5 47 L32 51.5 L29 54 Z M38.5 47 L32 51.5 L35 54 Z" fill={cloth} stroke={shade} stroke-width="0.8" />
  <path d="M32 51.5 V64" stroke="#C9D0D8" stroke-width="0.8" />
  <rect x="20" y="54" width="6.5" height="3.4" rx="0.6" fill={white} />
  <rect x="21" y="55.3" width="4.5" height="0.8" rx="0.4" fill="#C9D0D8" />
{:else if outfit === 7}
  <path d="M12 64 Q12 50 24 48 L29 64 Z M52 64 Q52 50 40 48 L35 64 Z" fill="#F2C230" />
  <path d="M12.8 58 L27.1 58 L28.1 61 L12.5 61 Z M51.2 58 L36.9 58 L35.9 61 L51.5 61 Z" fill="#D9DDE0" />
{:else if outfit === 8}
  <path d="M22 48.5 Q32 56 42 48.5 Q40 45.5 32 45.5 Q24 45.5 22 48.5 Z" fill={cloth} stroke={shade} stroke-width="1" />
  <path d="M29.5 52.5 V59 M34.5 52.5 V59" stroke={white} stroke-width="0.9" stroke-linecap="round" />
{:else if outfit === 9}
  <path d="M27 47 L32 60 L37 47 Z" fill="#F4F1EA" />
  <path d="M27 47 L32 60 M37 47 L32 60 L32 64" fill="none" stroke={shade} stroke-width="1.2" />
  <circle cx="33.6" cy="61.5" r="0.7" fill={white} />
{:else if outfit === 10}
  <path d="M26.5 47.4 Q32 52 37.5 47.4" fill="none" stroke={shade} stroke-width="1.2" />
  <path d="M32 51 L28 49 L28 53 Z M32 51 L36 49 L36 53 Z" fill={white} />
  <circle cx="32" cy="51" r="1.1" fill={white} stroke={shade} stroke-width="0.4" />
{:else if outfit === 11}
  <path d="M25 47.3 Q32 56 39 47.3 Z" fill={skin} />
  <path d="M27 48.5 Q32 53.5 37 48.5" fill="none" stroke="#D4A64A" stroke-width="0.8" />
  <circle cx="32" cy="52.6" r="1" fill="#D4A64A" />
{:else if outfit === 12}
  <rect x="26.5" y="42" width="11" height="8" rx="3" fill={cloth} />
  <path d="M27 44.5 H37 M27 46.5 H37" stroke={shade} stroke-width="0.6" />
{:else if outfit === 13}
  <path d="M26.5 47 L32 53 L37.5 47 Z" fill={white} />
  <path d="M26.5 47 L32 51.5 L28.5 54 Z M37.5 47 L32 51.5 L35.5 54 Z" fill={white} stroke="#C9D0D8" stroke-width="0.6" />
  <path d="M26 47.3 L32 54 L38 47.3" fill="none" stroke={shade} stroke-width="1.2" />
{:else if outfit === 14}
  <path d="M24.5 46 L27 50 L32 50.5 L37 50 L39.5 46 Q32 49 24.5 46 Z" fill={cloth} stroke={shade} stroke-width="0.8" />
  <path d="M32 50.5 V64" stroke="#C9D0D8" stroke-width="0.8" />
  <path d="M14 57 Q21 52 27 53.5 M50 57 Q43 52 37 53.5" fill="none" stroke="#D9DDE0" stroke-width="1.2" />
  <rect x="36" y="55.5" width="5" height="2" rx="0.4" fill="#C8722A" />
{:else if outfit === 15}
  <path d="M30.6 50.6 L33.4 50.6 L34 57 L32 59 L30 57 Z" fill="#2A2F36" />
  <path d="M26 47 L32 51 L28.5 54 Z M38 47 L32 51 L35.5 54 Z" fill={white} stroke="#C9D0D8" stroke-width="0.6" />
  <path d="M14.5 64 Q14 50 25 48 L32 58 V64 Z M49.5 64 Q50 50 39 48 L32 58 V64 Z" fill={cloth} />
  <circle cx="32" cy="60.5" r="0.6" fill={white} /><circle cx="32" cy="62.8" r="0.6" fill={white} />
{:else if outfit === 16}
  <clipPath id="avatar-shoulders"><path d={shoulders} /></clipPath>
  <path d={checks} clip-path="url(#avatar-shoulders)" stroke="rgb(255 255 255 / 0.25)" stroke-width="1.8" />
  <path d={checks} clip-path="url(#avatar-shoulders)" stroke={shade} stroke-width="0.5" />
  <path d="M26 47 L32 52 L28.5 55 Z M38 47 L32 52 L35.5 55 Z" fill={cloth} stroke={shade} stroke-width="0.8" />
  <path d="M32 52 V64" stroke={shade} stroke-width="0.8" />
{:else if outfit === 17}
  <path d="M26.5 47 L32 58 L37.5 47 Z" fill="#F7EFE6" />
  <path d="M26.5 47 L31.5 58 L28 64 M37.5 47 L32.5 58 L36 64" fill="none" stroke={shade} stroke-width="1" />
  <path d="M26 47 Q32 52 38 47 L37 50 Q32 55 27 50 Z M33 52 L35 60 L32.5 61 L31.5 53 Z" fill="#D9A441" />
{/if}
