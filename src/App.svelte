<script lang="ts">
  import Player from './lib/Player.svelte';
  import Setup from './lib/Setup.svelte';
  import { state } from './lib/StateStore';
  import type { Video, UserResponse, FollowResponse, ClipResponse, Clip, Options, ChannelFollowResponse } from './types';

  let videos: Video[] | null = null;
  let error: string;
  let loading: boolean = false; // TODO: Show loading-state
  let userToken: string | null = null;

  if (window.location.search) getToken(window.location.search);

  if (window.location.hash) {
    // Handle access token return
    if (window.location.hash.startsWith('#access_token=')) {
      const response: { access_token: string; scope: string; state: string; token_type: string } = Object.fromEntries(
        window.location.hash
          .substring(1)
          .split('&')
          .map((x) => x.split('='))
      );
      const newState = decodeURIComponent(response.state);
      const searchParams = new URLSearchParams(newState);

      userToken = response.access_token;

      // Update URL
      const url = new URL(window.location.origin);
      url.search = newState;
      history.replaceState(newState, '', url);

      // Update state
      const sort = ['viewsTotal', 'viewPerChannel', 'popularity'].some((value) => value === searchParams.get('sort'))
        ? (searchParams.get('sort') as 'viewsTotal' | 'viewPerChannel' | 'popularity')
        : null;
      const time = Number(searchParams.get('time'));
      
      if (sort && time) {
        state.set({
          sort,
          time
        });
      } else {
        videos = null;
        state.set(null);
        if (window.location.search) history.replaceState({}, '', window.location.origin);
      }
    }
  }

  state.subscribe(async (options) => {
    if (options) {
      loading = true;
      try {
        const userResult = await callAPI<UserResponse>('https://api.twitch.tv/helix/users');

        if (userResult.data.length > 0) {
          videos = await getVideos(userResult.data[0].id, options);
        } else {
          error = 'No user returned';
        }
      } catch (error) {
        console.log(error);
      }
      loading = false;
    }
  });

  async function getVideos(userid: string, options: Options): Promise<Video[]> {
    let videos: Video[] = [];

    const follows = (await callAPI<FollowResponse>(`https://api.twitch.tv/helix/channels/followed?user_id=${userid}`)).data;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - options.time);

    // Get clips
    let clipsPerFollow = (
      await Promise.all(
        follows.map(
          async (follow) =>
            (
              await callAPI<ClipResponse>(`https://api.twitch.tv/helix/clips?broadcaster_id=${follow.broadcaster_id}&started_at=${fromDate.toISOString()}`)
            ).data
        )
      )
    ).filter((clips) => clips.length > 0);

    // Sort clips and form Video objects
    switch (options.sort) {
      case 'viewsTotal': {
        const clips = clipsPerFollow.flat().sort((a, b) => b.view_count - a.view_count);
        videos = clips.map((clip) => ({
          source_url: `${clip.thumbnail_url.slice(0, clip.thumbnail_url.indexOf('-preview'))}.mp4`,
          title: clip.title,
          broadcaster_name: clip.broadcaster_name,
          view_count: clip.view_count,
          vod_url: `https://www.twitch.tv/videos/${clip.video_id}?t=${clip.vod_offset}s`,
        }));
        break;
      }
      case 'viewPerChannel': {
        let clipsPerChannelSorted: Clip[][] = [];
        for (const clips of clipsPerFollow) {
          clipsPerChannelSorted.push(clips.sort((a, b) => b.view_count - a.view_count));
        }

        while (clipsPerChannelSorted.length > 0) {
          for (let i = 0; i < clipsPerChannelSorted.length; i++) {
            const clip = clipsPerChannelSorted[i].shift()!;
            videos.push({
              source_url: `${clip.thumbnail_url.slice(0, clip.thumbnail_url.indexOf('-preview'))}.mp4`,
              title: clip.title,
              broadcaster_name: clip.broadcaster_name,
              view_count: clip.view_count,
              vod_url: `https://www.twitch.tv/videos/${clip.video_id}?t=${clip.vod_offset}s`,
            });
          }
          clipsPerChannelSorted = clipsPerChannelSorted.filter((channel) => channel.length !== 0);
        }
        break;
      }
      case 'popularity': {
        const clipsPerChannelWithFollowCount: { clips: Clip[]; followCount: number }[] = await Promise.all(
          clipsPerFollow.map(async (clips) => ({
            clips: clips,
            followCount: (
              await callAPI<ChannelFollowResponse>(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${clips[0].broadcaster_id}`)
            ).total,
          }))
        );

        for (const clipsAndFollows of clipsPerChannelWithFollowCount) {
          for (const clip of clipsAndFollows.clips) {
            videos.push({
              source_url: `${clip.thumbnail_url.slice(0, clip.thumbnail_url.indexOf('-preview'))}.mp4`,
              title: clip.title,
              broadcaster_name: clip.broadcaster_name,
              view_count: clip.view_count,
              vod_url: `https://www.twitch.tv/videos/${clip.video_id}?t=${clip.vod_offset}s`,
              popularity: (clip.view_count / clipsAndFollows.followCount) * 100000,
            });
          }
        }
        videos.sort((a, b) => b.popularity! - a.popularity!);
        break;
      }
    }

    return videos;
  }

  async function callAPI<T>(url: string): Promise<T> {
    if (userToken == null) throw new Error('userToken is null when calling TwitchAPI');

    const res = await fetch(url, {
      headers: {
        'Client-ID': import.meta.env.VITE_API_CLIENT_ID,
        Authorization: `Bearer ${userToken}`,
      },
    });
    const json = await res.json();
    if (json.error) throw new Error(`${json.error}: ${json.message}`);
    return json;
  }

  function getToken(state: string) {
    const currentState = encodeURIComponent(state);
    window.location.replace(
      `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${import.meta.env.VITE_API_CLIENT_ID}&redirect_uri=${window.location.origin}&scope=user%3Aread%3Afollows&state=${currentState}`
    );
  }
</script>

{#if !videos}
  <Setup {error} {loading} {getToken} />
{:else}
  <Player {videos} />
{/if}
