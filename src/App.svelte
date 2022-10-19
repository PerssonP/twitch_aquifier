<script lang="ts">
  import Player from './lib/Player.svelte';

  import type { User, FollowFrom, Clip } from './twitchAPITypes';

  let videos: Clip[];

  let userLogin: string;
  let error: string;

  const options = {
    sortOrder: 'viewsTotal' as 'viewsTotal' | 'viewPerChannel',
  };

  async function handleSubmit() {
    try {
      const userResult = await callAPI<User[]>(`https://api.twitch.tv/helix/users?login=${userLogin}`);

      if (userResult.length > 0) {
        videos = await getClips(userResult[0].id);
      } else {
        error = `No user found with login ${userLogin}`;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function getClips(userid: string) {
    const follows = await callAPI<FollowFrom[]>(`https://api.twitch.tv/helix/users/follows?from_id=${userid}`);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    const clipsResult = await Promise.all(
      follows.map((follow) => callAPI<Clip[]>(`https://api.twitch.tv/helix/clips?broadcaster_id=${follow.to_id}&started_at=${fromDate.toISOString()}`))
    );

    if (options.sortOrder === 'viewsTotal') {
      const clips = clipsResult.reduce((acc: Clip[], curr) => {
        acc = acc.concat(curr);
        return acc;
      }, []);

      return clips.sort((a, b) => Number(b.view_count) - Number(a.view_count));
    } else if (options.sortOrder === 'viewPerChannel') {
      let clipsPerUser = clipsResult.reduce((acc: Clip[][], curr) => {
        if (curr.length > 0) {
          acc.push(curr.sort((a, b) => Number(b.view_count) - Number(a.view_count)));
        }
        return acc;
      }, []);

      const clips = [];
      while (clipsPerUser.length > 0) {
        for (let i = 0; i < clipsPerUser.length; i++) {
          clips.push(clipsPerUser[i].shift());
        }
        clipsPerUser = clipsPerUser.filter((value) => value.length !== 0);
      }
      return clips;
    }
  }

  async function callAPI<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: {
        'Client-ID': import.meta.env.VITE_TESTING_API_CLIENT_ID,
        Authorization: `Bearer ${import.meta.env.VITE_TESTING_API_TOKEN}`,
      },
    });
    const json = await res.json();
    if (json.error) throw new Error(`${json.error}: ${json.message}`); // TODO: detect OAuth token is expired and refresh automatically
    return json.data;
  }
</script>

{#if !videos}
  <form class="userForm" on:submit|preventDefault={handleSubmit}>
    <p>Enter twitch login:</p>
    <div>
      <input bind:value={userLogin} />
      <button type="submit">Submit</button>
    </div>
    <p style="color: rgb(220 38 38);">{error ?? ''}</p>
    <div class="options">
      <p>Sort order:</p>
      <div>
        <input type="radio" id="viewsTotal" bind:group={options.sortOrder} value="viewsTotal" />
        <label for="viewsTotal">viewsTotal</label>
      </div>
      <div>
        <input type="radio" id="viewPerChannel" bind:group={options.sortOrder} value="viewPerChannel" />
        <label for="viewPerChannel">viewPerChannel</label>
      </div>
    </div>
  </form>
{:else}
  <Player {videos} />
{/if}

<style>
  .userForm {
    display: flex;
    flex-direction: column;
    text-align: center;
  }

  .options {
    text-align: left;
  }
</style>
