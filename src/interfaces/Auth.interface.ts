export interface ICallbackResponse {
    id_token: string;
    access_token: string;
}

export interface IMe {
    sub: string;
    email: string;
    preferred_username: string;
    name: string;
}
