<script lang="ts">
  import { state } from './StateStore';
  import type { Options } from '../types';

  export let error: string;
  export let loading: boolean;
  export let getToken: (state: string) => void;

  let options: Options = {
    sort: 'viewsTotal',
    time: 1,
  };

  function handleSubmit() {
    loading = true;
    getToken(`?sort=${options.sort}&time=${options.time}`)
  }
</script>

<form class="userForm" on:submit|preventDefault={handleSubmit}>
  <p>Click to authenticate with Twitch:</p>
  <div>
    <button type="submit" disabled={loading}>Fetch clips</button>
  </div>
  <p style="color: rgb(220 38 38);">{error ?? ''}</p>
  <div class="options">
    <div class="sort">
      <p>Sort order:</p>
      <div>
        <input type="radio" id="viewsTotal" bind:group={options.sort} value="viewsTotal" />
        <label for="viewsTotal">viewsTotal</label>
      </div>
      <div>
        <input type="radio" id="viewPerChannel" bind:group={options.sort} value="viewPerChannel" />
        <label for="viewPerChannel">viewPerChannel</label>
      </div>
      <div>
        <input type="radio" id="popularity" bind:group={options.sort} value="popularity" />
        <label for="popularity">popularity</label>
      </div>
    </div>
    <div class="time">
      <p>Timespan (days):</p>
      <input type="number" bind:value={options.time} />
    </div>
  </div>
</form>

<style>
  .userForm {
    display: flex;
    flex-direction: column;
    text-align: center;
  }

  .options {
    display: grid;
    grid-template: 1fr / 1fr 1fr;
    text-align: left;
  }

  .time p {
    display: inline-block;
  }

  .time input {
    width: 35px;
  }
</style>
