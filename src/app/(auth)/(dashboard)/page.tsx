"use client";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import IRequest from "@/interfaces/Request.interface";
import requestService from "@/services/request.service";
import { useQuery } from "@tanstack/react-query";

export default function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => requestService.list(),
  });

  if (!data) return <></>;

  return (
    <>
      <SiteHeader name="Управление заявками" />
      <div className="mx-auto w-[1000px] my-4">
        <div className="overflow-hidden rounded-lg border">
          <Table className="w-full">
            <TableHeader className="bg-muted sticky top-0">
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Ключ</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Управление</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((request: IRequest) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.creator}
                  </TableCell>
                  <TableCell>{request.key}</TableCell>
                  <TableCell>
                    {request.status === "PENDING" ? (
                      <Badge className="bg-amber-500 text-white">Ожидает</Badge>
                    ) : request.status === "REJECT" ? (
                      <Badge className="bg-red-500 text-white">Отклонена</Badge>
                    ) : request.status === "ACCEPT" ? (
                      <Badge className="bg-green-500 text-white">Принята</Badge>
                    ) : (
                      <></>
                    )}
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button>Принять</Button>
                    <Button variant="destructive">Отклонить</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
