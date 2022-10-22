<script lang="ts">
  import Player from './lib/Player.svelte';
  import Setup from './lib/Setup.svelte';
  import { state } from './lib/StateStore';
  import type { UserResponse, FollowResponse, ClipResponse, Clip, Options } from './types';

  let videos: Clip[] = [];
  let error: string;
  let loading: boolean = false; // TODO: Show loading-state

  window.addEventListener('popstate', handleStateChange);

  if (window.location.search) handleStateChange();

  function handleStateChange() {
    const searchParams = new URLSearchParams(window.location.search);
    const username = searchParams.get('username');
    const sort = ['viewsTotal', 'viewPerChannel', 'popularity'].some((value) => value === searchParams.get('sort'))
      ? (searchParams.get('sort') as 'viewsTotal' | 'viewPerChannel' | 'popularity')
      : null;
    const time = Number(searchParams.get('time'));

    if (username && sort && time) {
      state.set({
        username,
        sort,
        time,
      });
    } else {
      videos = [];
      state.set(null);
      if (window.location.search) history.replaceState({}, '', window.location.origin);
    }
  }

  state.subscribe(async (options) => {
    if (options?.username) {
      loading = true;
      try {
        const userResult = await callAPI<UserResponse>(`https://api.twitch.tv/helix/users?login=${options.username}`);

        if (userResult.data.length > 0) {
          videos = await getClips(userResult.data[0].id, options);
        } else {
          error = `No user found with login ${options.username}`;
        }
      } catch (error) {
        console.log(error);
      }
      loading = false;
    }
  });

  async function getClips(userid: string, options: Options): Promise<Clip[]> {
    let clips: Clip[] = [];

    const follows = (await callAPI<FollowResponse>(`https://api.twitch.tv/helix/users/follows?from_id=${userid}`)).data;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - options.time);

    // Get clips
    let clipsPerFollow = (
      await Promise.all(
        follows.map(
          async (follow) =>
            (
              await callAPI<ClipResponse>(`https://api.twitch.tv/helix/clips?broadcaster_id=${follow.to_id}&started_at=${fromDate.toISOString()}`)
            ).data
        )
      )
    ).filter((clips) => clips.length > 0);

    // Sort clips
    switch (options.sort) {
      case 'viewsTotal': {
        clips = clipsPerFollow.flat().sort((a, b) => b.view_count - a.view_count);
      }
      case 'viewPerChannel': {
        let clipsPerChannelSorted: Clip[][] = [];
        for (const clips of clipsPerFollow) {
          clipsPerChannelSorted.push(clips.sort((a, b) => b.view_count - a.view_count));
        }

        while (clipsPerChannelSorted.length > 0) {
          for (let i = 0; i < clipsPerChannelSorted.length; i++) {
            clips.push(clipsPerChannelSorted[i].shift()!);
          }
          clipsPerChannelSorted = clipsPerChannelSorted.filter((channel) => channel.length !== 0);
        }
        return clips;
      }
      case 'popularity': {
        const clipsPerChannelWithFollowCount: { clips: Clip[]; followCount: number }[] = await Promise.all(
          clipsPerFollow.map(async (clips) => ({
            clips: clips,
            followCount: (await callAPI<FollowResponse>(`https://api.twitch.tv/helix/users/follows?to_id=${clips[0].broadcaster_id}&first=1`)).total,
          }))
        );

        const clipsWithPopularity: { clip: Clip; popularity: number }[] = [];
        for (const clipsAndFollows of clipsPerChannelWithFollowCount) {
          for (const clip of clipsAndFollows.clips) {
            clipsWithPopularity.push({ clip: clip, popularity: clip.view_count / clipsAndFollows.followCount });
          }
        }
        clips = clipsWithPopularity.sort((a, b) => b.popularity - a.popularity).map((x) => x.clip);
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

{#if !videos.length}
  <Setup {error} />
{:else}
  <Player {videos} />
{/if}
