<script lang="ts">
  import { BACKGROUNDS, CLOTHES, EYES, HAIRS, SCARVES, SHADE, SKINS, WOMAN, type Character } from "./avatars.js";
  import CharacterExtras from "./character-extras.svelte";
  import CharacterOutfit from "./character-outfit.svelte";

  let { character }: { character: Character } = $props();

  const skin = $derived(SKINS[character.skin]);
  const hair = $derived(HAIRS[character.hairColor]);
  const scarf = $derived(SCARVES[character.hairColor]);
  const iris = $derived(EYES[character.eyeColor]);
  const cloth = $derived(CLOTHES[character.outfitColor]);
  const hijab = $derived(character.hair === 11);
  const woman = $derived(character.gender === WOMAN);
  const lips = $derived(woman ? "#B5524A" : "#5A2E24");
  const hatted = $derived(character.headwear === 1 || character.headwear === 2 || character.headwear === 3);

  const ink = "#2A1F1A";
  const shade = SHADE;
  const wrinkle = "rgb(60 30 20 / 0.35)";
  const freckles: [number, number][] = [[24, 33.6], [25.8, 34.8], [23.4, 35.4], [26.4, 33.2], [40, 33.6], [38.2, 34.8], [40.6, 35.4], [37.6, 33.2]];
  const jaw = "M20.5 32 Q21.5 44.5 32 44.5 Q42.5 44.5 43.5 32 Q40 39.5 32 39.5 Q24 39.5 20.5 32 Z";
  const cap = "M20 27 Q19 15.5 32 15.5 Q45 15.5 44 27 Q41 20.5 32 20.5 Q23 20.5 20 27 Z";
  const fringe = "M19.5 30 Q18 15 32 15 Q46 15 44.5 30 Q42 21 32 20.5 Q23 21 19.5 30 Z";
  const curls: [number, number, number][] = [
    [22, 21, 3.2],
    [25, 17.5, 3.5],
    [29.5, 15.5, 3.6],
    [34.5, 15.5, 3.6],
    [39, 17.5, 3.5],
    [42, 21, 3.2],
  ];
  const sideCurls: [number, number, number][] = [
    [16.5, 34, 4],
    [47.5, 34, 4],
    [16, 44, 4.5],
    [48, 44, 4.5],
    [17, 52, 4],
    [47, 52, 4],
  ];
  const sides = [27, 37];
  const locks = [15.5, 19.5, 40.5, 44.5];
  const long = "M17 32 Q16 12 32 12 Q48 12 47 32 L49 54 L15 54 Z";
</script>

<svg viewBox="0 0 64 64" class="size-full" aria-hidden="true">
  <circle cx="32" cy="32" r="32" fill={BACKGROUNDS[character.background]} />

  {#if character.hair === 6}
    <circle cx="32" cy="25" r="16.5" fill={hair} />
  {:else if character.hair === 7}
    <path d="M18 30 Q17 13 32 13 Q47 13 46 30 L46 40 Q46 42 44 42 L20 42 Q18 42 18 40 Z" fill={hair} />
  {:else if character.hair === 8 || character.hair === 10 || character.hair === 14 || character.hair === 23}
    <path d={long} fill={hair} />
    {#if character.hair === 14}
      <path d="M17.5 36 V53 M20.5 38 V54 M43.5 38 V54 M46.5 36 V53" stroke={shade} stroke-width="0.9" />
    {/if}
    {#if character.hair === 10}
      {#each sideCurls as [cx, cy, r] (`${cx},${cy}`)}<circle {cx} {cy} {r} fill={hair} />{/each}
    {/if}
  {:else if character.hair === 12}
    <path d="M40 16 Q50 18 48 30 Q47 40 44 46 Q42 40 43 32 Q44 22 40 16 Z" fill={hair} />
  {:else if character.hair === 17}
    <path d="M17.5 30 Q16 13 32 13 Q48 13 46.5 30 Q49 38 46 44 Q48 47 44 48 L20 48 Q16 47 18 44 Q15 38 17.5 30 Z" fill={hair} />
  {:else if character.hair === 18}
    {#each locks as x (x)}<rect {x} y="20" width="4" height="27" rx="2" fill={hair} />{/each}
  {:else if character.hair === 19 && !hatted}
    <circle cx="21" cy="15" r="5" fill={hair} /><circle cx="43" cy="15" r="5" fill={hair} />
  {:else if hijab}
    <path d="M16 32 Q15 10 32 10 Q49 10 48 32 Q48 44 44 50 L20 50 Q16 44 16 32 Z" fill={scarf} />
  {/if}

  <CharacterOutfit outfit={character.outfit} {cloth} {skin} />

  {#if hijab}
    <path d="M19 34 Q19 49 32 52 Q45 49 45 34 L45 30 L19 30 Z" fill={scarf} />
  {:else}
    <ellipse cx="20" cy="31" rx="2" ry="3" fill={skin} />
    <ellipse cx="44" cy="31" rx="2" ry="3" fill={skin} />
  {/if}
  <ellipse cx="32" cy="30" rx="12" ry="13.5" fill={skin} />

  {#if character.marks === 1}
    <ellipse cx="24.5" cy="34.6" rx="2.7" ry="1.6" fill="#E8746A" opacity="0.4" />
    <ellipse cx="39.5" cy="34.6" rx="2.7" ry="1.6" fill="#E8746A" opacity="0.4" />
  {:else if character.marks === 2}
    {#each freckles as [cx, cy] (`${cx},${cy}`)}<circle {cx} {cy} r="0.5" fill="#8A5233" opacity="0.6" />{/each}
  {:else if character.marks >= 3}
    <g fill="none" stroke={wrinkle} stroke-width={character.marks === 5 ? 0.8 : 0.6} stroke-linecap="round">
      <path d="M28.2 34 Q26.6 36.4 27.6 38.6 M35.8 34 Q37.4 36.4 36.4 38.6" />
      {#if character.marks >= 4}
        <path d="M22.6 29.6 L21.3 29.1 M22.6 31.2 L21.3 31.7 M41.4 29.6 L42.7 29.1 M41.4 31.2 L42.7 31.7" />
        <path d="M27 22.6 Q32 21.6 37 22.6" />
      {/if}
      {#if character.marks === 5}
        <path d="M26 24.4 Q32 23.4 38 24.4 M24.8 33 Q27 34.2 29.2 33 M34.8 33 Q37 34.2 39.2 33" />
      {/if}
    </g>
  {/if}

  {#if character.beard === 1}
    <path d={jaw} fill={hair} opacity="0.3" />
  {:else if character.beard === 3}
    <path d="M29 39.5 Q32 38.5 35 39.5 Q35 43.8 32 44 Q29 43.8 29 39.5 Z" fill={hair} />
  {:else if character.beard === 4}
    <path d={jaw} fill={hair} />
  {:else if character.beard === 5}
    <path d="M20.5 32 Q20 50 32 51 Q44 50 43.5 32 Q40 39.5 32 39.5 Q24 39.5 20.5 32 Z" fill={hair} />
  {/if}

  {#each sides as x (x)}
    <path d="M{x - 2.5} 26.8 Q{x} 25.6 {x + 2.5} 26.6" fill="none" stroke={hijab ? ink : hair} stroke-width="1.2" stroke-linecap="round" />
    {#if character.eyes === 0}
      <circle cx={x} cy="30.5" r="2.3" fill="white" />
      <circle cx={x} cy="30.5" r="1.5" fill={iris} />
      <circle cx={x} cy="30.5" r="0.7" fill={ink} />
      <circle cx={x + 0.5} cy="30" r="0.4" fill="white" />
    {:else if character.eyes === 1}
      <path d="M{x - 2.7} 30.5 Q{x} 28.2 {x + 2.7} 30.5 Q{x} 32.6 {x - 2.7} 30.5 Z" fill="white" />
      <circle cx={x} cy="30.5" r="1.25" fill={iris} />
      <circle cx={x} cy="30.5" r="0.6" fill={ink} />
    {:else if character.eyes === 2}
      <path d="M{x - 2} 31 Q{x} 29 {x + 2} 31" fill="none" stroke={ink} stroke-width="1.3" stroke-linecap="round" />
    {:else}
      <circle cx={x} cy="30.5" r="1.8" fill={iris} />
      <circle cx={x} cy="30.5" r="0.8" fill={ink} />
    {/if}
  {/each}
  {#if character.mouth === 0}
    <path d="M28 36.5 Q32 39.5 36 36.5" fill="none" stroke={lips} stroke-width="1.4" stroke-linecap="round" />
  {:else if character.mouth === 1}
    <path d="M28 36 Q32 41 36 36 Z" fill="#8E3B33" />
    <path d="M29 36.3 Q32 37.3 35 36.3" fill="none" stroke="white" stroke-width="0.8" />
  {:else}
    <path d="M29.5 37 Q32 37.8 34.5 37" fill="none" stroke={lips} stroke-width="1.3" stroke-linecap="round" />
  {/if}
  {#if character.beard >= 2}
    <path d="M27.5 35.6 Q32 33.6 36.5 35.6 Q34 36.4 32 35.4 Q30 36.4 27.5 35.6 Z" fill={hair} />
  {/if}

  {#if character.hair === 1}
    <path d="M20.3 25.5 Q21 16.3 32 16.3 Q43 16.3 43.7 25.5 Q41 19.5 32 19.3 Q23 19.5 20.3 25.5 Z" fill={hair} opacity="0.9" />
  {:else if character.hair === 2 || character.hair === 6 || character.hair === 18}
    <path d={cap} fill={hair} />
  {:else if character.hair === 3}
    <path d="M19.8 28 Q18.5 14 32 14 Q45.5 14 44.2 28 Q43 22 40 20 Q33 23.5 24 21.5 Q21 23 19.8 28 Z" fill={hair} />
  {:else if character.hair === 4}
    <path d="M20 27 Q19 17 27 14 Q33 10.5 40 13 Q45.5 16 44 27 Q41 20.5 32 20.5 Q23 20.5 20 27 Z" fill={hair} />
  {:else if character.hair === 5 || character.hair === 10}
    <path d={cap} fill={hair} />
    {#each curls as [cx, cy, r] (cx)}<circle {cx} {cy} {r} fill={hair} />{/each}
  {:else if character.hair === 7}
    <path d="M19.5 30 Q18 15 32 15 Q46 15 44.5 30 Q43 22 38 21 Q30 23 22 22 Q20 25 19.5 30 Z" fill={hair} />
  {:else if character.hair === 8 || character.hair === 14 || character.hair === 19}
    <path d={fringe} fill={hair} />
  {:else if character.hair === 9}
    {#if !hatted}<circle cx="32" cy="12.5" r="6" fill={hair} />{/if}
    <path d={fringe} fill={hair} />
  {:else if character.hair === 12}
    <path d="M20 27 Q19 15 32 15 Q45 15 44 27 Q42 19 32 19 Q22 19 20 27 Z" fill={hair} />
    <rect x="41" y="17" width="2.4" height="3" rx="1" fill={cloth} transform="rotate(30 42 18.5)" />
  {:else if character.hair === 13}
    <path d="M19.8 29 Q18.5 14.5 32 14.5 Q45.5 14.5 44.2 27 Q42 21 36 19.5 Q30 24 21.5 23 Q20.5 26 19.8 29 Z" fill={hair} />
  {:else if character.hair === 15}
    <path d={cap} fill={hair} opacity="0.45" />
    {#if !hatted}<path d="M28 21 Q27 10 32 9 Q37 10 36 21 Q32 19.5 28 21 Z" fill={hair} />{/if}
  {:else if character.hair === 16}
    {#if !hatted}<circle cx="32" cy="13" r="4" fill={hair} />{/if}
    <path d={cap} fill={hair} />
  {:else if character.hair === 17}
    <path d="M19.5 30 Q18 15 32 15 Q46 15 44.5 30 Q44 22 40 19 Q32 24 22 21 Q20 25 19.5 30 Z" fill={hair} />
  {:else if character.hair === 20}
    <path d="M20 26 Q19.5 14 32 14 Q44.5 14 44 26 Q42 18 32 17.5 Q22 18 20 26 Z" fill={hair} />
    <path d="M26 16.2 Q32 14.8 38 16.2" fill="none" stroke="rgb(255 255 255 / 0.3)" stroke-width="0.8" />
  {:else if character.hair === 21}
    <path d="M18.5 27 Q17 8 32 8 Q47 8 45.5 27 Q40 21 32 21 Q24 21 18.5 27 Z" fill={scarf} />
    <path d="M20 22 Q32 12 44 22 M22 15.5 Q32 20 42 11.5" fill="none" stroke={shade} stroke-width="0.8" />
  {:else if character.hair === 22}
    <path d="M20 27 Q19.5 18 25 16.5 Q27 19 24 22 Q21.5 24 20 27 Z M44 27 Q44.5 18 39 16.5 Q37 19 40 22 Q42.5 24 44 27 Z" fill={hair} />
  {:else if character.hair === 23}
    <path d="M19.5 31 Q18 15 32 15 Q46 15 44.5 30 Q43 21 37 19 Q30 25 21 28 Q20 29 19.5 31 Z" fill={hair} />
  {:else if hijab}
    <path d="M18.5 31 Q18 13 32 13 Q46 13 45.5 31 Q44 18 32 18 Q20 18 18.5 31 Z" fill={scarf} />
  {/if}

  <CharacterExtras glasses={character.glasses} headwear={character.headwear} {cloth} />
</svg>
