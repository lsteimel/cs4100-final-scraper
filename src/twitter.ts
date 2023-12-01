import { promises as fs } from 'fs';

import { RequestManager } from './request';
import { TwitterGuestAccount } from './auth/guest';
import { 
    TwitterConstructor, 
    TwitterGuestAccountCredentials,
    TWITTER_TWEET_DETAIL_ROUTE,
    TWITTER_TWEET_DETAIL_FEATURES,
    TWITTER_TWEET_DETAIL_VARIABLES,
    TWITTER_DETAIL_GUEST_VARIABLES,
    TWITTER_DETAIL_GUEST_ROUTE,
    TweetChunk,
    TweetLinkChunk,
    TweetMediaChunk,
    TweetInstruction,
    TwitterAPIData,
    TweetEntry,
    TweetData,
    Tweet,
    TweetVideoVariant,
    GetThreadResponse,
    TWITTER_DETAIL_GUEST_FEATURES,
    TwitterAccountCredentials
} from './constants';
import { logger } from './logger';

export class Twitter {
    private requestManager: RequestManager;
    private credentials: TwitterAccountCredentials[] = [];
    private proxies: string[] = [];

    constructor(options: TwitterConstructor = {}) {
        this.credentials = options.credentials ?? [];
        this.proxies = options.proxies ?? [];

        this.requestManager = new RequestManager({
            credentials: this.credentials,
            proxies: this.proxies
        });
    }

    public async loadCredentialsFromFile(path: string): Promise<void> {
        const fileContents = await fs.readFile(path, 'utf-8');

        this.credentials = JSON.parse(
            fileContents.toString()
        );

        this.requestManager.setCredentials(this.credentials);
    }

    public async loadAccountsFromFile(path: string): Promise<void> {
        const fileContents = await fs.readFile(path, 'utf-8');

        fileContents.toString().split('\n').forEach((line: string) => {
            const [username, password, email, emailPw, authToken, ct0, userAgent, encodedSession] = line.split(':');

            if (username && password) {
                this.credentials.push({
                    username,
                    password,
                    email,
                    emailPw,
                    authToken,
                    ct0,
                    userAgent,
                    cookies: JSON.parse(Buffer.from(encodedSession, 'base64').toString('utf-8'))
                });
            }
        });
    }

    public async loadProxiesFromFile(path: string): Promise<void> {
        const fileContents = await fs.readFile(path, 'utf-8');

        this.proxies = JSON.parse(
            fileContents.toString()
        );

        this.requestManager.setProxies(this.proxies);
    }

    // public async createCredentials(amount: number, path?: string): Promise<void> {
    //     for (let i = 0; i < amount; i++) {
    //         logger.info(`Creating guest credentials ${i + 1}/${amount}`);

    //         const guestAccount = new TwitterGuestAccount(this.requestManager);

    //         try {
    //             const credentials = await guestAccount.create();

    //             this.credentials.push(credentials as TwitterGuestAccountCredentials);

    //             if (path) {
    //                 await fs.writeFile(
    //                     path, 
    //                     JSON.stringify(this.credentials)
    //                 );
    //             }
    //         } catch(e: any) {
    //             logger.error(`Failed to create guest credentials ${i + 1}/${amount}: ${e.message}`);
    //         }
    //     }
    // }

    private async getTweetDetail(id: string, cursor?: string): Promise<TwitterAPIData> {
        const url = new URL(TWITTER_TWEET_DETAIL_ROUTE);
        const variables = {
            ...TWITTER_TWEET_DETAIL_VARIABLES,
            focalTweetId: id,
            cursor
        };
        
        url.searchParams.set('variables', JSON.stringify(variables));
        url.searchParams.set('features', JSON.stringify(TWITTER_TWEET_DETAIL_FEATURES));

        const response = await this.requestManager.send(url.toString(), {
            method: 'GET',
            mobile: false,
        });

        // console.log(response);

        const { data }: any = await response.json();

        return (data as TwitterAPIData);
    }

    private async getTweetDetailV2(id: string, cursor?: string): Promise<TwitterAPIData> {
        const url = new URL(TWITTER_DETAIL_GUEST_ROUTE);
        const variables = {
            ...TWITTER_DETAIL_GUEST_VARIABLES,
            tweetId: id,
            cursor
        };
        
        url.searchParams.set('variables', JSON.stringify(variables));
        url.searchParams.set('features', JSON.stringify(TWITTER_DETAIL_GUEST_FEATURES));

        const response = await this.requestManager.send(url.toString(), {
            method: 'GET'
        });

        const { data }: any = await response.json();

        return (data as TwitterAPIData);
    }

    private getEntries(data: TwitterAPIData): TweetEntry[] {
        const addEntriesInstructions = data.threaded_conversation_with_injections_v2.instructions.filter(
            (instruction: TweetInstruction) => instruction.type === 'TimelineAddEntries'
        ).map(
            (instruction: TweetInstruction) => instruction.entries
        );

        return addEntriesInstructions.flat();
    }

    private getModuleEntries(data: TwitterAPIData, conversationId: string): TweetEntry[] {
        const addModuleInstructions = data.threaded_conversation_with_injections_v2.instructions.find(
            (instruction: TweetInstruction) => instruction.type === 'TimelineAddToModule' && instruction.moduleEntryId === conversationId
        );

        return addModuleInstructions?.moduleItems ?? [];
    }

    private getTweetFromEntries(id: string, entries: TweetEntry[]): TweetData | null {
        const tweetIndex = entries.findIndex(entry => entry.entryId === `tweet-${id}`);

        if (tweetIndex === -1) {
            return null;
        }

        const tweetEntry = entries[tweetIndex];
        const tweetType = tweetEntry?.content?.itemContent?.tweetDisplayType || '';

        if (!tweetEntry.content.itemContent) {
            return null;
        }

        return {
            tweetEntry,
            tweetType,
            tweet: tweetEntry.content.itemContent.tweet_results.result,
            index: tweetIndex
        };
    }

    private getUpCursor(entries: TweetEntry[]): string | null {
        const cursorEntry = entries.find(
            entry => 
                entry?.content?.entryType === 'TimelineTimelineItem' && 
                entry?.content?.itemContent?.itemType === 'TimelineTimelineCursor' &&
                entry?.content?.itemContent?.cursorType === 'Top'
        );

        return cursorEntry?.content?.itemContent?.value ?? null;
    }

    private async getParentThread(id: string, entries: TweetEntry[], tweetData: TweetData): Promise<Tweet[]> {
        const thread = [];

        let currentTweet = tweetData.tweet;

        while (currentTweet.legacy?.in_reply_to_status_id_str) {
            const parentTweet = this.getTweetFromEntries(currentTweet.legacy.in_reply_to_status_id_str, entries);

            if (!parentTweet) {
                const cursor = this.getUpCursor(entries);

                if (!cursor) {
                    break;
                }

                const data = await this.getTweetDetail(id, cursor);
                entries = this.getEntries(data);

                continue;
            }

            thread.unshift(parentTweet.tweet);

            currentTweet = parentTweet.tweet;
        }

        return thread;
    }

    private async getSelfThreadChildren(id: string, entries: TweetEntry[], tweetData: TweetData): Promise<Tweet[]> {
        const selfThreadChildren: Tweet[] = [];

        if (tweetData.tweetType !== 'SelfThread') return selfThreadChildren;

        const childrenEntries = entries[tweetData.index + 1];

        if (childrenEntries.content.displayType !== 'VerticalConversation') {
            return selfThreadChildren;
        }

        const { items } = childrenEntries.content;

        if (!items) return selfThreadChildren;

        for (let i = 0; i < items.length; i++) {
            const { item } = items[i];

            if (item?.itemContent?.cursorType === 'ShowMore') {
                const cursor = item.itemContent.value;

                const data = await this.getTweetDetail(id, cursor);

                const moduleEntries = this.getModuleEntries(data, childrenEntries.entryId);

                items.push(
                    ...moduleEntries
                );

                continue;
            }

            if (item.itemContent.tweetDisplayType !== 'SelfThread') {
                return selfThreadChildren;
            }

            selfThreadChildren.push(item.itemContent.tweet_results.result);
        }

        return selfThreadChildren;
    }

    private replaceLinks(text: string, links: TweetLinkChunk[]): string {
        let offset = 0;

        for (const link of links) {
            const start = link.startIndex + offset;
            const end = link.endIndex + offset;

            text = text.slice(0, start) + link.href + text.slice(end);

            offset += link.href.length - (end - start);

            link.startIndex = start;
            link.endIndex = start + link.href.length;
        }

        return text;
    }
    
    private convertTweetToChunk(tweet: Tweet): TweetChunk {
        const id = tweet.legacy.id_str;
        const createdAt = Date.parse(tweet.legacy.created_at) / 1000;

        const entities = tweet?.note_tweet?.note_tweet_results?.result?.entity_set ?? tweet.legacy.entities;

        const links: TweetLinkChunk[] = [];

        if (entities?.urls) {
            for (const link of entities?.urls) {
                if (link.indices.length < 2) continue;

                links.push({
                    href: link.expanded_url,
                    startIndex: link.indices[0],
                    endIndex: link.indices[1]
                });
            }
        }

        // Links should already be in order, but just to be safe
        links.sort((l1: TweetLinkChunk, l2: TweetLinkChunk) => l1.startIndex - l2.startIndex); 

        const textContent = this.replaceLinks(tweet?.note_tweet?.note_tweet_results?.result?.text ?? tweet.legacy.full_text, links);

        let quotedTweet;

        if (tweet.quoted_status_result) {
            quotedTweet = this.convertTweetToChunk(tweet.quoted_status_result.result);
        }

        const media: TweetMediaChunk[] = [];
        const mediaIds = new Set<string>();

        const mediaEntities = [
            ...(tweet.legacy.extended_entities?.media ?? []),
            ...(entities?.media ?? [])
        ];

        for (const item of mediaEntities) {
            if (mediaIds.has(item.id_str)) continue;

            if (item.type === 'video') {
                const videos = item.video_info?.variants.filter(
                    (v: TweetVideoVariant) => v.content_type === 'video/mp4' && typeof v.bitrate === 'number'
                );

                videos.sort((v1: TweetVideoVariant, v2: TweetVideoVariant) => v1.bitrate - v2.bitrate);

                if (videos.length === 0) continue;

                mediaIds.add(item.id_str);
                media.push({
                    id: item.id_str,
                    mediaKey: item.media_key,
                    type: item.type,
                    imageUrl: item.media_url_https,
                    videoDurationMs: item.video_info?.duration_millis,
                    videoUrl: videos[videos.length - 1].url
                });

                continue;
            }

            mediaIds.add(item.id_str);
            media.push({
                id: item.id_str,
                mediaKey: item.media_key,
                type: item.type,
                imageUrl: item.media_url_https,
            });
        }

        return {
            id,
            twitterUserId: tweet.legacy.user_id_str,
            type: 'tweet',
            textContent,
            createdAt,
            quotingTweet: quotedTweet,
            links,
            media
        };
    }

    public async getThread(id: string): Promise<TweetChunk> {
        const data = await this.getTweetDetail(id);

        const entries = this.getEntries(data);
        const tweetData = this.getTweetFromEntries(id, entries);

        if (!tweetData) {
            throw new Error('Failed to get tweet data');
        }

        const tweet = tweetData.tweet;
        const chunk = this.convertTweetToChunk(tweet);

        return chunk;

        // const [
        //     parentThread,
        //     selfThreadChildren
        // ] = await Promise.all([
        //     this.getParentThread(id, entries, tweetData),
        //     this.getSelfThreadChildren(id, entries, tweetData)
        // ]);

        // const thread: Tweet[] = [
        //     ...parentThread,
        //     tweetData.tweet,
        //     ...selfThreadChildren
        // ];

        // const ids = new Set<string>([tweetData.tweet.legacy.id_str]);

        // const chunks: TweetChunk[] = [];

        // for (const tweet of thread) {
        //     const chunk = this.convertTweetToChunk(tweet);

        //     if (tweetData.tweetType === 'SelfThread') {
        //         ids.add(chunk.id);
        //     }

        //     chunks.push(
        //         chunk
        //     );
        // }

        // return {
        //     ids: Array.from(ids),
        //     chunks
        // };
    }
};