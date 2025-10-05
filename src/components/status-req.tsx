import IRequest from "@/interfaces/Request.interface";
import { Badge } from "./ui/badge";

export default function StatusRequest({
  status,
}: {
  status: IRequest["status"];
}) {
  return status === "PENDING" ? (
    <Badge className="bg-amber-500 text-white">Ожидает</Badge>
  ) : status === "REJECT" ? (
    <Badge className="bg-red-500 text-white">Отклонена</Badge>
  ) : status === "ACCEPT" ? (
    <Badge className="bg-green-500 text-white">Принята</Badge>
  ) : (
    <></>
  );
}
