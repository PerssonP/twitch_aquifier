<script lang="ts">
  import type { User, FollowFrom, Clip } from '../twitchAPITypes';
  export let videos: Clip[];


  type optionsType = {
    sortOrder: 'viewsTotal' | 'viewPerChannel' | 'popularity';
    timespan: number;
  };

  let userLogin: string;
  let error: string;

  const options: optionsType = {
    sortOrder: 'viewsTotal',
    timespan: 1,
  };

  async function handleSubmit() {
    try {
      const userResult = await callAPI<User[]>(`https://api.twitch.tv/helix/users?login=${userLogin}`);

      if (userResult.length > 0) {
        const clips = await getClipsPerFollow(userResult[0].id);
        videos = sortClips(clips);
        console.log(videos);
      } else {
        error = `No user found with login ${userLogin}`;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function getClipsPerFollow(userid: string): Promise<Clip[][]> {
    const follows = await callAPI<FollowFrom[]>(`https://api.twitch.tv/helix/users/follows?from_id=${userid}`);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - options.timespan);
    return await Promise.all(
      follows.map((follow) => callAPI<Clip[]>(`https://api.twitch.tv/helix/clips?broadcaster_id=${follow.to_id}&started_at=${fromDate.toISOString()}`))
    );
  }

  function sortClips(clipsPerChannel: Clip[][]): Clip[] {
    if (options.sortOrder === 'viewsTotal') {
      const clips = clipsPerChannel.reduce((acc: Clip[], curr) => {
        acc = acc.concat(curr);
        return acc;
      }, []);

      return clips.sort((a, b) => Number(b.view_count) - Number(a.view_count));
    } else if (options.sortOrder === 'viewPerChannel') {
      let clipsPerChannelSorted = clipsPerChannel.reduce((acc: Clip[][], curr) => {
        if (curr.length > 0) {
          acc.push(curr.sort((a, b) => Number(b.view_count) - Number(a.view_count)));
        }
        return acc;
      }, []);

      const clips = [];
      while (clipsPerChannelSorted.length > 0) {
        for (let i = 0; i < clipsPerChannelSorted.length; i++) {
          clips.push(clipsPerChannelSorted[i].shift());
        }
        clipsPerChannelSorted = clipsPerChannelSorted.filter((value) => value.length !== 0);
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

<form class="userForm" on:submit|preventDefault={handleSubmit}>
  <p>Enter twitch login:</p>
  <div>
    <input bind:value={userLogin} />
    <button type="submit">Submit</button>
  </div>
  <p style="color: rgb(220 38 38);">{error ?? ''}</p>
  <div class="options">
    <div class="sort">
      <p>Sort order:</p>
      <div>
        <input type="radio" id="viewsTotal" bind:group={options.sortOrder} value="viewsTotal" />
        <label for="viewsTotal">viewsTotal</label>
      </div>
      <div>
        <input type="radio" id="viewPerChannel" bind:group={options.sortOrder} value="viewPerChannel" />
        <label for="viewPerChannel">viewPerChannel</label>
      </div>
      <div>
        <input type="radio" id="popularity" bind:group={options.sortOrder} value="popularity" />
        <label for="popularity">popularity</label>
      </div>
    </div>
    <div class="time">
      <p>Timespan (days):</p>
      <input type="number" bind:value={options.timespan} />
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
    grid-template-columns: 1fr 1fr;
    text-align: left;
  }

  .time p {
    display: inline-block;
  }

  .time input {
    width: 50px;
  }
</style>
