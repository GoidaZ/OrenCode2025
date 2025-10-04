export interface IKey {
  id: number;
  key: string;
  creator: string;
  status: "PENDING" | "REJECT" | "ACCEPT";
  created_at: string;
}

export interface IKeyDetail {
  path: string;
  data: {
    data: Record<string, any>;
    metadata: {
      created_time: string;
      custom_metadata: Record<string, any> | null;
      deletion_time: string;
      destroyed: boolean;
      version: number;
    };
  };
  wrap: any | null;
  lease: number;
  renew: boolean;
  auth: any | null;
}
