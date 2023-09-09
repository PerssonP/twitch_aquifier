export type UserResponse = {
  data: {
    broadcaster_type: string;
    created_at: string;
    description: string;
    display_name: string;
    id: string;
    login: string;
    offline_image_url: string;
    profile_image_url: string;
    type: string;
    view_count: number;
  }[];
};

export type FollowResponse = {
  data: {
    broadcaster_id: string;
    broadcaster_login: string;
    broadcaster_name: string;
    followed_at: string;
  }[];
  pagination: {
    cursor: string;
  };
  total: number;
};

export type ChannelFollowResponse = {
  data: {
    user_id: string;
    user_login: string;
    user_name: string;
    followed_at: string;
  }[];
  pagination: {
    cursor: string;
  };
  total: number;
};

export type Clip = {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number;
};

export type ClipResponse = {
  data: Clip[];
};

export type ErrorResponse = {
  error: string;
  status: number;
  message: string;
};

export type Options = {
  username: string | null;
  sort: 'viewsTotal' | 'viewPerChannel' | 'popularity';
  time: number;
};

export type Video = {
  source_url: string;
  title: string;
  broadcaster_name: string;
  view_count: number;
  vod_url: string;
  popularity?: number;
}