<script lang="ts">
  import type { UserResponse, FollowResponse, ClipResponse, Clip } from '../twitchAPITypes';
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
      if (!userLogin) {
        error = 'Please enter your username on Twitch';
        return;
      }

      const userResult = await callAPI<UserResponse>(`https://api.twitch.tv/helix/users?login=${userLogin}`);

      if (userResult.data.length > 0) {
        const clipsPerFollow = await getClipsPerFollow(userResult.data[0].id);
        videos = await sortClips(clipsPerFollow);
      } else {
        error = `No user found with login ${userLogin}`;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function getClipsPerFollow(userid: string): Promise<Clip[][]> {
    const follows = (await callAPI<FollowResponse>(`https://api.twitch.tv/helix/users/follows?from_id=${userid}`)).data;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - options.timespan);
    let clipsPerFollow = await Promise.all(
      follows.map(
        async (follow) =>
          (
            await callAPI<ClipResponse>(`https://api.twitch.tv/helix/clips?broadcaster_id=${follow.to_id}&started_at=${fromDate.toISOString()}`)
          ).data
      )
    );
    return clipsPerFollow.filter((clips) => clips.length > 0);
  }

  async function sortClips(clipsPerChannel: Clip[][]): Promise<Clip[]> {
    let clips: Clip[] = [];
    switch (options.sortOrder) {
      case 'viewsTotal': {
        clips = clipsPerChannel.flat().sort((a, b) => b.view_count - a.view_count);
      }
      case 'viewPerChannel': {
        let clipsPerChannelSorted: Clip[][] = [];
        for (const clips of clipsPerChannel) {
          clipsPerChannelSorted.push(clips.sort((a, b) => b.view_count - a.view_count));
        }

        while (clipsPerChannelSorted.length > 0) {
          for (let i = 0; i < clipsPerChannelSorted.length; i++) {
            clips.push(clipsPerChannelSorted[i].shift());
          }
          clipsPerChannelSorted = clipsPerChannelSorted.filter((value) => value.length !== 0);
        }
        return clips;
      }
      case 'popularity': {
        const clipsPerChannelWithFollowCount: { clips: Clip[]; followCount: number }[] = await Promise.all(
          clipsPerChannel.map(async (clips) => ({
            clips: clips,
            followCount: (await callAPI<FollowResponse>(`https://api.twitch.tv/helix/users/follows?to_id=${clips[0].broadcaster_id}&first=1`)).total,
          }))
        );

        const clipsWithPopularity: { clip: Clip; popularity: number; }[] = [];
        for (const clipsAndFollows of clipsPerChannelWithFollowCount) {
          for (const clip of clipsAndFollows.clips) {
            clipsWithPopularity.push({ clip: clip, popularity: clip.view_count / clipsAndFollows.followCount });
          }
        }
        clips = clipsWithPopularity.sort((a, b) => b.popularity - a.popularity).map(x => x.clip);
      }
    }

    return clips;
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
    return json;
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
