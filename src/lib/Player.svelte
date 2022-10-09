<script lang="ts">
  import { onMount } from 'svelte';
  import type { Clip } from '../twitchAPITypes';
  export let videos: Clip[];

  let player1: HTMLVideoElement;
  let player2: HTMLVideoElement;

  let player1Src = `${videos[0].thumbnail_url.slice(0, videos[0].thumbnail_url.indexOf('-preview'))}.mp4`;
  let player2Src = `${videos[1].thumbnail_url.slice(0, videos[1].thumbnail_url.indexOf('-preview'))}.mp4`;

  let loadingNextVid = true;
  let cnt = 2;
  let end = videos.length;

  let player1Hidden = false;

  onMount(async () => {
    player1.play();
    player1.oncanplay = (_) => (loadingNextVid = false);
    player2.oncanplay = (_) => (loadingNextVid = false);
  });

  const nextVid = () => {
    if (cnt < end) {
      const clip = videos[cnt];
      console.log(clip);
      const newURL = `${clip.thumbnail_url.slice(0, clip.thumbnail_url.indexOf('-preview'))}.mp4`;

      player1Hidden = !player1Hidden;
      loadingNextVid = true;
      if (player1Hidden) {
        player2.play();
        player1Src = newURL;
      } else {
        player1.play();
        player2Src = newURL;
      }

      cnt++;
    }
  };
</script>

<div style="display: flex; justify-content: center; margin: 0 2rem">
  <!-- svelte-ignore a11y-media-has-caption -->
  <video bind:this={player1} class:hidden={player1Hidden} src={player1Src} preload="auto" controls id="player1" />
  <!-- svelte-ignore a11y-media-has-caption -->
  <video bind:this={player2} class:hidden={!player1Hidden} src={player2Src} preload="auto" controls id="player2" />
</div>

<button on:click={nextVid} disabled={loadingNextVid}>Next</button>

<style>
  .hidden {
    display: none;
  }
</style>
