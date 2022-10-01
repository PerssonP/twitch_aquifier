<script lang="ts">
  import type { Clip } from '../twitchAPITypes';
  export let videos: Clip[];

  let cnt = 0;
  let end = videos.length;

  let vidPlayer: HTMLVideoElement;

  const nextVid = () => {
    if (cnt < end) {
      let regex = /(?<=https:\/\/clips-media-assets2.twitch.tv\/).+(?=\/)/;
      const clip = videos[cnt];
      //console.log(clip)
      console.log(clip.thumbnail_url);
      const clipID = clip.thumbnail_url.match(regex)[0];
      let newURL = `https://clips-media-assets2.twitch.tv/${clipID}/AT-cm%7C${clipID}.mp4`
      vidPlayer.src = newURL;

      cnt++;
    }
  };
</script>

<div style="display: flex; justify-content: center; margin: 0 2rem">
  <!-- svelte-ignore a11y-media-has-caption -->
  <video bind:this={vidPlayer} playsinline src="" controls id="temp" />
</div>

<button on:click={nextVid}>Next</button>
