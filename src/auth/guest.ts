
import { 
    TWITTER_BEARER_TOKEN,
    TWITTER_GUEST_TOKEN_ROUTE,
    TWITTER_ONBOARDING_ROUTE,
    FLOW_TOKEN_BODY,
    TwitterGuestAccountCredentials
} from '../constants';
import { RequestManager } from '../request';

export class TwitterGuestAccount {
    private credentials: TwitterGuestAccountCredentials | null = null;
    private requestManager: RequestManager;
    private guestToken: string = '';
    private flowToken: string = '';

    constructor(requestManager: RequestManager) {
        this.requestManager = requestManager;
    }

    private async createGuestToken(): Promise<void> {
        const response = await this.requestManager.send(TWITTER_GUEST_TOKEN_ROUTE, {
            headers: {
                Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`
            },
            method: 'POST',
            useCredentials: false
        });

        // console.log(response.status)
        // console.log(response.body)

        const { guest_token }: any = await response.json();

        if (!guest_token || typeof guest_token !== 'string') {
            throw new Error('Failed to create guest token');
        }

        this.guestToken = guest_token;
    }

    private async createFlowToken(): Promise<void> {
        const url = new URL(TWITTER_ONBOARDING_ROUTE);

        url.searchParams.set('flow_name', 'welcome');
        url.searchParams.set('api_version', '1');
        url.searchParams.set('known_device_token', '');
        url.searchParams.set('sim_country_code', 'us');

        const response = await this.requestManager.send(url.toString(), {
            headers: {
                Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
                'X-Guest-Token': this.guestToken,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            useCredentials: false,
            body: JSON.stringify(FLOW_TOKEN_BODY)
        });

        const { flow_token }: any = await response.json();
        
        if (!flow_token || typeof flow_token !== 'string') {
            throw new Error('Failed to create flow token');
        }

        this.flowToken = flow_token;
    }

    private async finalizeGuestAccount(): Promise<void> {
        const guestAccountBody: any = {
            ...FLOW_TOKEN_BODY,
            flow_token: this.flowToken,
            subtask_inputs: [{
                open_link: {
                    link: "next_link"
                },
                subtask_id: "NextTaskOpenLink"
            }]
        };

        delete guestAccountBody.input_flow_data;

        const response = await this.requestManager.send(TWITTER_ONBOARDING_ROUTE, {
            headers: {
                Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
                'X-Guest-Token': this.guestToken,
                'Content-Type': 'application/json',
            },
            method: 'POST',
            useCredentials: false,
            body: JSON.stringify(guestAccountBody)
        });

        // console.log(response);

        const { subtasks }: any = await response.json();

        if (!subtasks) {
            throw new Error('Failed to finalize guest account (subtasks)');
        }

        const account = subtasks.find((task: any) => task.subtask_id === 'OpenAccount')?.open_account;

        if (!account) {
            throw new Error('Failed to finalize guest account (account). Most likely proxy is on cooldown.');
        }

        // console.log(JSON.stringify(subtasks));
        // console.log(account)

        this.credentials = {
            token: account.oauth_token,
            secret: account.oauth_token_secret
        };
    }

    public async create(): Promise<TwitterGuestAccountCredentials | null> {
        await this.createGuestToken();
        await this.createFlowToken();
        await this.finalizeGuestAccount();

        // console.log(this.credentials);

        return this.credentials;
    }

    public getCredentials(): TwitterGuestAccountCredentials | null {
        return this.credentials;
    }
};