<script lang="ts">
  import Player from './lib/Player.svelte';
  import Setup from './lib/Setup.svelte';

  import type { Clip } from './twitchAPITypes';

  let videos: Clip[];

</script>

{#if !videos}
  <Setup bind:videos={videos} />
{:else}
  <Player {videos} />
{/if}

