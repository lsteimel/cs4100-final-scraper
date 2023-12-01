// Twitter scraping constants
export const TWITTER_CONSUMER_KEY = '3nVuSoBZnx6U4vzUxf5w';
export const TWITTER_CONSUMER_SECRET = 'Bcs59EFbbsdF6Sl9Ng71smgStWEGwXXKSjYvPVt7qys';
export const TWITTER_BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

export const TWITTER_API_URL = 'https://api.twitter.com';
export const TWITTER_GRAPHQL_URL = TWITTER_API_URL + '/graphql';

export const TWITTER_GUEST_TOKEN_ROUTE = TWITTER_API_URL + '/1.1/guest/activate.json';
export const TWITTER_ONBOARDING_ROUTE = TWITTER_API_URL + '/1.1/onboarding/task.json';

export const TWITTER_TWEET_DETAIL_ROUTE = TWITTER_GRAPHQL_URL + '/8sK2MBRZY9z-fgmdNpR3LA/TweetDetail';
export const TWITTER_TWEET_DETAIL_VARIABLES = {"focalTweetId":"","referrer":"messages","with_rux_injections":false,"includePromotedContent":true,"withCommunity":true,"withQuickPromoteEligibilityTweetFields":true,"withBirdwatchNotes":true,"withVoice":true,"withV2Timeline":true};
export const TWITTER_TWEET_DETAIL_FEATURES = {"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"tweetypie_unmention_optimization_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":false,"tweet_awards_web_tipping_enabled":false,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_media_download_video_enabled":false,"responsive_web_enhance_cards_enabled":false};

export const TWITTER_DETAIL_GUEST_ROUTE = TWITTER_GRAPHQL_URL + '/5GOHgZe-8U2j5sVHQzEm9A/TweetResultByRestId'
export const TWITTER_DETAIL_GUEST_VARIABLES = {"tweetId":"","withCommunity":false,"includePromotedContent":false,"withVoice":false};
export const TWITTER_DETAIL_GUEST_FEATURES = {"creator_subscriptions_tweet_preview_api_enabled":true,"c9s_tweet_anatomy_moderator_badge_enabled":true,"tweetypie_unmention_optimization_enabled":true,"responsive_web_edit_tweet_api_enabled":true,"graphql_is_translatable_rweb_tweet_is_translatable_enabled":true,"view_counts_everywhere_api_enabled":true,"longform_notetweets_consumption_enabled":true,"responsive_web_twitter_article_tweet_consumption_enabled":false,"tweet_awards_web_tipping_enabled":false,"responsive_web_home_pinned_timelines_enabled":true,"freedom_of_speech_not_reach_fetch_enabled":true,"standardized_nudges_misinfo":true,"tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled":true,"longform_notetweets_rich_text_read_enabled":true,"longform_notetweets_inline_media_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"responsive_web_media_download_video_enabled":false,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"responsive_web_graphql_timeline_navigation_enabled":true,"responsive_web_enhance_cards_enabled":false};

export const MOBILE_CIPHER_SUITE = 'TLS_AES_256_GCM_SHA384';
export const MOBILE_TLS_VERSION = 'TLSv1.2';
export const MOBILE_USERAGENT = 'TwitterAndroid/9.95.0-release.0 (29950000-r-0) ONEPLUS+A3010/9 (OnePlus;ONEPLUS+A3010;OnePlus;OnePlus3;0;;1;2016)';

export const DESKTOP_USERAGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36';

export const FLOW_TOKEN_BODY = {"flow_token":null,"input_flow_data":{"country_code":null,"flow_context":{"start_location":{"location":"splash_screen"}},"requested_variant":null,"target_user_id":0},"subtask_versions":{"generic_urt":3,"standard":1,"open_home_timeline":1,"app_locale_update":1,"enter_date":1,"email_verification":3,"enter_password":5,"enter_text":5,"one_tap":2,"cta":7,"single_sign_on":1,"fetch_persisted_data":1,"enter_username":3,"web_modal":2,"fetch_temporary_password":1,"menu_dialog":1,"sign_up_review":5,"interest_picker":4,"user_recommendations_urt":3,"in_app_notification":1,"sign_up":2,"typeahead_search":1,"user_recommendations_list":4,"cta_inline":1,"contacts_live_sync_permission_prompt":3,"choice_selection":5,"js_instrumentation":1,"alert_dialog_suppress_client_events":1,"privacy_options":1,"topics_selector":1,"wait_spinner":3,"tweet_selection_urt":1,"end_flow":1,"settings_list":7,"open_external_link":1,"phone_verification":5,"security_key":3,"select_banner":2,"upload_media":1,"web":2,"alert_dialog":1,"open_account":2,"action_list":2,"enter_phone":2,"open_link":1,"show_code":1,"update_users":1,"check_logged_in_account":1,"enter_email":2,"select_avatar":4,"location_permission_prompt":2,"notifications_permission_prompt":4}};

export const DEFAULT_REQUEST_OPTIONS: RequestManagerSendParams = {
    mobile: true,
    useProxy: true,
    useCredentials: true,
    headers: {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
        'x-twitter-active-user': 'yes'
    },
    method: 'GET'
};

// Twitter Types
export type Tweet = {
    legacy: {
        entities?: {
            media: any[],
            urls: any[]
        },
        extended_entities?: {
            media: any[]
        },
        full_text: string,
        user_id_str: string,
        id_str: string,
        in_reply_to_status_id_str?: string,
        created_at: string
    },
    quoted_status_result?: {
        result: Tweet
    },
    note_tweet?: {
        note_tweet_results?: {
            result?: {
                text: string,
                entity_set: {
                    media: any[],
                    urls: any[]
                }
            }
        }
    }
};

export type TweetItemContent = {
    itemType?: string,
    value?: string,
    tweetDisplayType?: string,
    cursorType?: string,
    tweet_results: {
        result: Tweet
    }
};
export type TweetEntryContent = {
    entryType?: string,
    displayType?: string,
    items: {
        item: {
            itemContent: TweetItemContent
        }
    }[],
    itemContent: TweetItemContent
};

export type TweetEntry = {
    entryId: string,
    content: TweetEntryContent,
    item: TweetEntryContent
};

export type TweetData = {
    tweetEntry: TweetEntry,
    tweetType: string,
    tweet: Tweet,
    index: number
};

export type TweetInstruction = {
    type: 'TimelineAddEntries' | 'TimelineAddToModule',
    moduleEntryId?: string,
    entries: TweetEntry[],
    moduleItems: TweetEntry[]
};

export type TwitterAPIData = {
    threaded_conversation_with_injections_v2: {
        instructions: TweetInstruction[]
    }
};

export type TweetLinkChunk = {
    href: string,
    startIndex: number,
    endIndex: number
};
export type TweetVideoVariant = {
    bitrate: number,
    content_type: string,
    url: string
};
export type TweetMediaChunk = {
    id: string,
    type: string,
    imageUrl?: string,
    mediaKey?: string,
    videoUrl?: string,
    videoDurationMs?: number
};

export type TweetChunk = {
    id: string,
    type: 'tweet',
    twitterUserId: string,
    textContent: string,
    createdAt: number,
    quotingTweet?: TweetChunk,
    links: TweetLinkChunk[],
    media: TweetMediaChunk[]
};

export type GetThreadResponse = {
    ids: string[],
    chunks: TweetChunk[]
};

export type TwitterGuestAccountCredentials = {
    token: string,
    secret: string
};

export type TwitterAccountCredentials = {
    username: string,
    password: string
    email: string;
    emailPw: string;
    authToken: string;
    ct0: string;
    userAgent: string;
    cookies: any[];
};

export type TwitterAccountCookies = Record<string, string>;

export type FetchHeaders = {
    [key: string]: string
};
export type ProxyAgentOptions = {
    ciphers?: string,
    minVersion?: string,
    getProxyForUrl?: () => string
};

export type OAuthRequest = {
    method: string,
    url: string,
    body?: string
};
export type OAuthHeaderParams = {
    account: TwitterGuestAccountCredentials,
    request: OAuthRequest
};
export type RequestManagerSendParams = {
    mobile?: boolean,
    useProxy?: boolean,
    useCredentials?: boolean,
    headers?: FetchHeaders,
    body?: string,
    method: string
};

export type RequestManagerConstructor = {
    proxies?: string[],
    credentials?: TwitterAccountCredentials[]
};
export type TwitterConstructor = {
    proxies?: string[],
    credentials?: TwitterAccountCredentials[]
};