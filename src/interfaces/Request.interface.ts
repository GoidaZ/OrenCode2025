export default interface IRequest {
    id: number;
    key: string;
    creator: string;
    status: "PENDING" | "REJECT" | "ACCEPT";
    created_at: string;
}