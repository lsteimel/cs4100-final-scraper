import fetch from 'node-fetch';
import { ProxyAgent } from 'proxy-agent';

import { OAuth } from './auth/oauth';

import {
    MOBILE_CIPHER_SUITE,
    MOBILE_TLS_VERSION,
    MOBILE_USERAGENT,
    DESKTOP_USERAGENT,
    DEFAULT_REQUEST_OPTIONS,
    TwitterGuestAccountCredentials,
    RequestManagerConstructor,
    FetchHeaders,
    RequestManagerSendParams,
    ProxyAgentOptions,
    TWITTER_BEARER_TOKEN,
    TwitterAccountCookies,
    TwitterAccountCredentials
} from './constants';

class ProxyManager {
    private proxies: string[] = [];

    constructor(proxies: string[]) {
        this.proxies = proxies;
    }

    private formatProxy(proxy: string): string {
        const proxySplit = proxy.split(':');
    
        if (proxySplit.length > 3) {
            return "http://" + proxySplit[2] + ":" + proxySplit[3] + "@" + proxySplit[0] + ":" + proxySplit[1];
        }
    
        return "http://" + proxySplit[0] + ":" + proxySplit[1];
    }

    public getProxy(): string | null {
        if (this.proxies.length === 0) {
            return null;
        }

        this.proxies.push(this.proxies.shift() as string);

        return this.formatProxy(this.proxies[0]);
    }

    public setProxies(proxies: string[]) {
        this.proxies = proxies;
    }
};

export class RequestManager extends ProxyManager {
    private credentials: TwitterAccountCredentials[] = [];

    constructor(options: RequestManagerConstructor = {}) {
        super(options.proxies ?? []);
        this.credentials = options.credentials ?? [];

        // console.log('RequestManager constructor', options.proxies, options.credentials)
    }

    public setCredentials(credentials: TwitterAccountCredentials[]) {
        this.credentials = credentials;
    }

    // private getAuthorizationHeader(url: string, options: RequestManagerSendParams): string {
    //     if (this.credentials.length === 0) {
    //         throw new Error('No credentials loaded');
    //     }

    //     this.credentials.push(this.credentials.shift() as TwitterGuestAccountCredentials);

    //     return OAuth.createAuthorizationHeader({
    //         account: this.credentials[0],
    //         request: {
    //             method: options.method,
    //             url,
    //             body: options.body
    //         }
    //     });
    // }

    private getCsrfTokenAndCookieHeader(): {
        cookies: string;
        csrfToken: string;
    } {
        if (this.credentials.length === 0) {
            throw new Error('No credentials loaded');
        }

        this.credentials.push(this.credentials.shift() as TwitterAccountCredentials);

        const csrfToken = this.credentials[0].ct0;
        const cookieString = this.credentials[0].cookies.map(({ name, value }) => `${name}=${value}`).join('; ');

        return {
            cookies: cookieString,
            csrfToken
        };
    }

    public send(url: string, options: RequestManagerSendParams) {
        const coalescedOptions = {
            ...DEFAULT_REQUEST_OPTIONS,
            ...options
        };

        const agentOptions: ProxyAgentOptions = {};

        if (coalescedOptions.useProxy) {
            const proxy: string | null = this.getProxy();

            if (proxy) {
                agentOptions.getProxyForUrl = () => proxy;
            }
        }

        const headers: FetchHeaders = {
            ...DEFAULT_REQUEST_OPTIONS.headers,
            ...options.headers
        };

        if (coalescedOptions.mobile) {
            agentOptions.ciphers = MOBILE_CIPHER_SUITE;
            agentOptions.minVersion = MOBILE_TLS_VERSION;

            headers['user-agent'] = MOBILE_USERAGENT;
        } else {
            headers['user-agent'] = DESKTOP_USERAGENT;
        }

        // if (coalescedOptions.useCredentials) {
        //     headers['authorization'] = this.getAuthorizationHeader(url, coalescedOptions);
        // }

        if (coalescedOptions.useCredentials) {
            headers['authorization'] = `Bearer ${TWITTER_BEARER_TOKEN}`;

            const { cookies, csrfToken } = this.getCsrfTokenAndCookieHeader();

            headers['cookie'] = cookies;
            headers['x-csrf-token'] = csrfToken;
            headers['x-twitter-auth-type'] = 'OAuth2Session';
        }

        // console.log(headers);

        return fetch(url, {
            headers,
            body: coalescedOptions.body,
            method: coalescedOptions.method,
            agent: new ProxyAgent(agentOptions),
        });
    }
};