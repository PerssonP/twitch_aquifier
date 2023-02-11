<script lang="ts">
  import { onMount } from 'svelte';
  import { has_prop } from 'svelte/internal';
  import type { Video } from '../types';
  export let videos: Video[];

  console.log(videos);

  let player1: HTMLVideoElement;
  let player2: HTMLVideoElement;

  let loadingNextVid = true;
  let videoIndex = 0;
  let end = videos.length - 1;

  let player1Hidden = false;

  onMount(async () => {
    player1.addEventListener('canplay', () => player1.play(), { once: true });
  });

  const nextVid = () => {
    const preloadSrc = end >= videoIndex + 2 ? videos[videoIndex + 2].source_url : null;
    loadingNextVid = true;
    togglePlayer(preloadSrc);

    videoIndex++;
  };

  const hopToVid = (jumpIndex: number) => {
    if (jumpIndex == videoIndex) return;
    const preloadingPlayer = player1Hidden ? player1 : player2;
    const video = videos[jumpIndex];
    loadingNextVid = true;
    videoIndex = jumpIndex;
    preloadingPlayer.src = video.source_url;
    preloadingPlayer.addEventListener(
      'loadeddata',
      () => {
        const nextURL = end > jumpIndex ? videos[jumpIndex + 1].source_url : null;
        togglePlayer(nextURL);
      },
      { once: true }
    );
  };

  const togglePlayer = (nextURL: string | null) => {
    player1Hidden = !player1Hidden;
    const currentPlayer = player1Hidden ? player2 : player1;
    const preloadingPlayer = player1Hidden ? player1 : player2;

    preloadingPlayer.pause();
    currentPlayer.play();

    if (nextURL !== null) {
      preloadingPlayer.addEventListener(
        'loadeddata',
        () => {
          loadingNextVid = false;
        },
        { once: true }
      );
      preloadingPlayer.src = nextURL;
    } else {
      loadingNextVid = false;
    }
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
    <video bind:this={player1} class:hidden={player1Hidden} src={videos[0].source_url} preload="auto" controls id="player1" />
    <!-- svelte-ignore a11y-media-has-caption -->
    <video bind:this={player2} class:hidden={!player1Hidden} src={videos[1].source_url} preload="auto" controls id="player2" />
  </div>
  <div class="videoDetails">
    <p>Broadcaster: {videos[videoIndex].broadcaster_name}</p>
    <p>Title: {videos[videoIndex].title}</p>
    <p>Views: {videos[videoIndex].view_count}</p>
    {#if Object.hasOwn(videos[videoIndex], 'popularity')}
      <p>Popularity: {videos[videoIndex].popularity}</p>
    {/if}
    <a href={videos[videoIndex].vod_url}>Continue watching</a>
  </div>

  <button class="nextVid" on:click={nextVid} disabled={loadingNextVid || videoIndex >= end}>Next</button>
</div>

<style>
  .container {
    display: grid;
    width: 100%;
    height: 100%;
    grid-template-columns: 10% auto 10%;
    grid-template-rows: auto auto;
    grid-template-areas:
      'clipsList videoPlayer nextVidBtn'
      'clipsList videoDetails videoDetails';
  }

  .clipsList {
    grid-area: clipsList;
    list-style-type: none;
    margin: 0;
    padding: 0;
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
    grid-area: videoPlayer;
    place-self: center;
  }

  .videoPlayer video {
    height: 90vh;
    max-width: 100%;
  }

  .videoDetails {
    display: flex;
    grid-area: videoDetails;
    background-color: #1a1a1a;
    justify-content: space-around;
  }

  .videoDetails p {
    margin: 0;
  }

  .nextVid {
    grid-area: nextVidBtn;
    justify-self: end;
  }

  .hidden {
    display: none;
  }
</style>
