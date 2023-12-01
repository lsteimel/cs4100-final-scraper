import { createHmac } from 'crypto';
import { 
    TWITTER_CONSUMER_KEY, 
    TWITTER_CONSUMER_SECRET,
    TWITTER_API_URL,
    OAuthHeaderParams
} from '../constants';

export abstract class OAuth {
    private static generateNonce(): string {
        const rand: string = Math.random().toString() + Math.random().toString();
        
        return rand.slice(4).replace(/\+\/\=/g, '');
    }

    private static createPayload(params: OAuthHeaderParams, nonce: string, timestamp: number): string {
        const url = new URL(params.request.url);
        
        const oAuthData: string[][] = [
            ...url.searchParams.entries()
        ];

        if (params.request.body) {
            oAuthData.push(
                ...new URLSearchParams(params.request.body).entries()
            );
        }

        oAuthData.push(['oauth_version', '1.0']);
        oAuthData.push(['oauth_signature_method', 'HMAC-SHA1']);
        oAuthData.push(['oauth_consumer_key', TWITTER_CONSUMER_KEY]);
        oAuthData.push(['oauth_token', params.account.token])
        oAuthData.push(['oauth_nonce', nonce])
        oAuthData.push(['oauth_timestamp', timestamp.toString()]);

        oAuthData.sort((a, b) => {
            if (a[0] > b[0]) {
                return 1;
            }

            if (a[0] < b[0]) {
                return -1;
            }

            return 0;
        });

        const payload: string[] = [
            params.request.method,
            url.origin + url.pathname,
            new URLSearchParams(oAuthData).toString()
        ];

        return payload
            .map(c => encodeURIComponent(c))
            .join('&');
    }

    public static createAuthorizationHeader(params: OAuthHeaderParams): string {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();

        const payload = this.createPayload(params, nonce, timestamp);

        const hmacKey = `${TWITTER_CONSUMER_SECRET}&${params.account.secret}`;
        const sign = createHmac('sha1', hmacKey).update(payload).digest('base64');

        return `OAuth realm="${TWITTER_API_URL}/", oauth_version="1.0", oauth_token="${params.account.token}", oauth_nonce="${nonce}", oauth_timestamp="${timestamp}", oauth_signature="${encodeURIComponent(sign)}", oauth_consumer_key="${TWITTER_CONSUMER_KEY}", oauth_signature_method="HMAC-SHA1"`
    }
};