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
  total: number;
  data: {
    from_id: string;
    from_login: string;
    from_name: string;
    to_id: string;
    to_login: string;
    to_name: string;
    followed_at: string;
  }[];
  pagination: {
    cursor: string;
  };
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