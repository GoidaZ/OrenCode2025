export default interface IRequest {
    id: number;
    resource: string;
    creator: string;
    status: "PENDING" | "REJECT" | "ACCEPT";
    description: string;
    reason: string;
    valid_for: string;
    created_at: string;
}