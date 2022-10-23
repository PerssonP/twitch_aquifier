<script lang="ts">
  import { onMount } from 'svelte';
  import type { Video } from '../types';
  export let videos: Video[];

  console.log(videos)

  let player1: HTMLVideoElement;
  let player2: HTMLVideoElement;

  let player1Src = videos[0].source_url;
  let player2Src = videos[1].source_url;

  let loadingNextVid = true;
  let videoIndex = 0;
  let end = videos.length - 1;

  let player1Hidden = false;

  onMount(async () => {
    player1.play();
    player1.oncanplay = (_) => (loadingNextVid = false);
    player2.oncanplay = (_) => (loadingNextVid = false);
  });

  const nextVid = () => {
    const nextIndex = videoIndex + 2;
    if (nextIndex <= end) {
      const video = videos[nextIndex];

      player1Hidden = !player1Hidden;
      loadingNextVid = true;
      if (player1Hidden) {
        player1.pause();
        player2.play();
        player1Src = video.source_url;
      } else {
        player2.pause();
        player1.play();
        player2Src = video.source_url;
      }

      videoIndex++;
    }
  };

  const hopToVid = (index: number) => {
    const preloadingPlayer = player1Hidden ? player1 : player2;
    const video = videos[index];
    loadingNextVid = true;
    videoIndex = index;
    preloadingPlayer.src = video.source_url;
    preloadingPlayer.addEventListener(
      'canplay',
      () => {
        player1Hidden = !player1Hidden;
        const nextIndex = videoIndex + 1;
        if (nextIndex <= end) {
          const preloadVideo = videos[nextIndex];
          if (player1Hidden) {
            player1.pause();
            player2.play();
            player1Src = preloadVideo.source_url;
          } else {
            player2.pause();
            player1.play();
            player2Src = preloadVideo.source_url;
          }
        } else {
          if (player1Hidden) {
            player1.pause();
            player2.play();
          } else {
            player2.pause();
            player1.play();
          }
        }
      },
      { once: true }
    );
  };
</script>

<div class="container">
  <ul class="clipsList">
    {#each videos as video, i}
      <li>
        <button disabled={loadingNextVid} class={videoIndex === i ? 'current' : ''} on:click={() => hopToVid(i)}>
          <p>{video.title}</p>
          <p class="broadcasterName">{video.broadcaster_name}</p>
        </button>
      </li>
    {/each}
  </ul>

  <div class="videoPlayer">
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={player1} class:hidden={player1Hidden} src={player1Src} preload="auto" controls id="player1" />
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={player2} class:hidden={!player1Hidden} src={player2Src} preload="auto" controls id="player2" />
  </div>

  <button class="nextVid" on:click={nextVid} disabled={loadingNextVid || videoIndex >= end}>Next</button>
</div>

<style>
  .container {
    display: grid;
    width: 100%;
    height: 100%;
    grid-template-columns: 10% auto 10%;
  }

  .clipsList {
    list-style-type: none;
    margin-block: 0;
    margin-inline: 0;
    padding-inline: 0;
    overflow-y: scroll;
    overflow-x: hidden;
  }

  .clipsList li button {
    width: 100%;
  }

  .clipsList li button.current {
    background-color: darkgreen;
  }

  .clipsList p {
    display: block;
    margin-block: 0;
    margin-inline: 0;
  }

  .broadcasterName {
    font-size: 0.75em;
    color: gray;
  }

  .videoPlayer {
    place-self: center;
  }

  .videoPlayer video {
    height: 90vh;
    max-width: 100%;
  }

  .nextVid {
    justify-self: end;
  }

  .hidden {
    display: none;
  }
</style>
