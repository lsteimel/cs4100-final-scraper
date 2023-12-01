import { TweetChunk, TweetData } from './constants';
import { logger } from './logger';
import { Twitter } from './twitter';
import { promises as fs, readFile, readFileSync, writeFileSync } from 'fs';

const twitter = new Twitter();
const INPUT_DATA = './data/first-debate.txt';
const OUTPUT_PATH = `./threads/${Date.now()}.json`;
const CONCURRENCY = 4;

const parseTweetIds = async (filePath: string, size = 5_000): Promise<string[]> => {
    logger.info(`Parsing ${size} tweet ids from ${filePath}`);
    if (!filePath.endsWith('.txt')) {
        throw new Error('File must be a .txt file');
    }

    const tweetIds: string[] = [];
    const data = await readFileSync(filePath, 'utf-8');
    let lines = data.split('\n');

    // Randomize the lines
    lines = lines.sort(() => Math.random() - 0.5);
    for (let i = 0; i < size && i < lines.length; i++) {
        tweetIds.push(lines[i]);
    }

    logger.info(`Succesfully parsed ${tweetIds.length} tweet ids from ${filePath}`);
    return tweetIds;
}

(async () => {
    await twitter.loadProxiesFromFile('./proxies.json');
    await twitter.loadAccountsFromFile('./cookies.txt');

    const tweetIds = await parseTweetIds(INPUT_DATA, 1000);
    const tweetResults: TweetChunk[] = [];

    logger.info(`Fetching ${tweetIds.length} tweets on ${CONCURRENCY} threads`);

    setInterval(() => {
        writeFileSync(
            OUTPUT_PATH,
            JSON.stringify(
                tweetResults,
                null,
                2
            )
        );

        logger.info(`Wrote ${tweetResults.length} tweets to output`);
    }, 1000 * 30);

    const threads = await Promise.all(
        Array.from({ length: CONCURRENCY }, async (_, i) => {
            const chunk = tweetIds.slice(i * (tweetIds.length / CONCURRENCY), (i + 1) * (tweetIds.length / CONCURRENCY));

            for (let j = 0; j < chunk.length; j++) {
                const tweetId = chunk[j];
                try {
                    tweetResults.push(await twitter.getThread(tweetId));
                    logger.info(`[THREAD: ${i+1}, JOB: ${j+1}/${chunk.length}] Successfully scraped tweet id: ${tweetId}`);
                } catch (err: any) {
                    logger.warn(`[THREAD: ${i+1}, JOB: ${j+1}/${chunk.length}] Credential error fetching tweet ${tweetId}, queued for retry...`);
                    // logger.error(`[THREAD: ${i+1}, JOB: ${j+1}/${chunk.length}] Failed to fetch tweet ${tweetId}, ${err.message}`);
                    chunk.push(tweetId);
                }
            }
        })
    );


    // await fs.writeFile(
    //     `./threads/${tweetId}.json`, 
    //     JSON.stringify(
    //         await twitter.getThread(tweetId),
    //         null,
    //         2
    //     )
    // );
})();   