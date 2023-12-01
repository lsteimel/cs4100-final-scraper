import { Twitter } from './lib/index.ts';
import { promises as fs } from 'fs';

const tweetId = '1704281941439090707';

const twitter = new Twitter();

// await twitter.loadProxiesFromFile('./proxies.json');

// Credentials last for up for a month from what I've read
// Could vary, need a cronjob to refresh them, along with better error detection
// await twitter.createCredentials(50, './credentials.json');

await twitter.loadCredentialsFromFile('./credentials.json');

await fs.writeFile(
    `./threads/${tweetId}.json`, 
    JSON.stringify(
        await twitter.getThread(tweetId),
        null,
        2
    )
);