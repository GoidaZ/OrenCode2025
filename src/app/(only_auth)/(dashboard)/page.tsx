"use client";
import { SiteHeader } from "@/components/site-header";
import StatusRequest from "@/components/status-req";
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
import { useRouter } from "next/navigation";

export default function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: () => requestService.list(),
  });
  const router = useRouter()

  if (!data) return <>Loading...</>;

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
                  <TableCell>{request.resource}</TableCell>
                  <TableCell>
                    <StatusRequest status={request.status}/>
                  </TableCell>
                  <TableCell className="flex gap-1">
                    <Button onClick={() => router.push(`/req/${request.id}`)}>Подробнее</Button>
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
