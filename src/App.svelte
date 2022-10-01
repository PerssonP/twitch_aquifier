<script lang="ts">
  import Player from './lib/Player.svelte';

  import type { User, FollowFrom, Clip } from './twitchAPITypes';

  let videos: Clip[];

  let userLogin: string;
  let user: User;
  let error: string;
  let follows: FollowFrom[];

  async function handleSubmit() {
    try {
      const userResult = await callAPI<User[]>(`https://api.twitch.tv/helix/users?login=${userLogin}`);

      if (userResult.length > 0) {
        user = userResult[0];
        follows = await callAPI<FollowFrom[]>(`https://api.twitch.tv/helix/users/follows?from_id=${user.id}`);

        videos = await getClips(follows);
      } else {
        error = `No user found with login ${userLogin}`;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function getClips(follows: FollowFrom[]) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 1);
    const clipsResult = await Promise.all(
      follows.map((follow) => callAPI<Clip[]>(`https://api.twitch.tv/helix/clips?broadcaster_id=${follow.to_id}&started_at=${fromDate.toISOString()}`))
    );
    const clips = clipsResult.reduce((acc: Clip[], curr) => {
      acc = acc.concat(curr);
      return acc;
    }, []);

    return clips.sort((a, b) => Number(b.view_count) - Number(a.view_count));
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

<main>
  {#if !videos}
    <form on:submit|preventDefault={handleSubmit}>
      <div>
        <p>Enter twitch login:</p>
        <input bind:value={userLogin} />
        <button type="submit">Submit</button>
      </div>
    </form>
    <p style="color: rgb(220 38 38);">{error ?? ''}</p>
  {:else}
    <Player videos={videos} />
  {/if}
</main>
