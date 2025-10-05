"use client";

import { SiteHeader } from "@/components/site-header";
import StatusRequest from "@/components/status-req";
import IRequest from "@/interfaces/Request.interface";
import requestService from "@/services/request.service";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Request() {
  const req_id = 1;
  const [body, setBody] = useState<Record<string, string>>({});
  const { data, isLoading } = useQuery({
    queryKey: ["requests_info", req_id],
    queryFn: () => requestService.list(),
    select: (data: IRequest[]) => data.filter((r) => r.id == req_id)[0],
  });

  const updateKey = (index: number, newKey: string) => {
    const entries = Object.entries(body);
    entries[index][0] = newKey;
    setBody(Object.fromEntries(entries));
  };

  const updateValue = (index: number, newValue: string) => {
    const entries = Object.entries(body);
    entries[index][1] = newValue;
    setBody(Object.fromEntries(entries));
  };

  const removeEntry = (index: number) => {
    const entries = Object.entries(body);
    entries.splice(index, 1);
    setBody(Object.fromEntries(entries));
  };

  if (!data) return;

  return (
    <>
      <SiteHeader name={`Управление заявкой #${data.id}`} />
      <div className="mx-auto w-[1000px] my-4 space-y-3">
        <div className="bg-muted p-4 rounded-2xl space-y-1">
          <div>
            <span className="font-semibold">ID:</span> {data.resource}
          </div>
          <div>
            <span className="font-semibold">Описание:</span> {data.description}
          </div>
          <div>
            <span className="font-semibold">Статус:</span>{" "}
            <StatusRequest status={data.status} />
          </div>
        </div>
        <div className="bg-muted p-4 rounded-2xl space-y-1">
          <Table className="w-full">
            <TableHeader className="bg-muted sticky top-0">
              <TableRow>
                <TableHead>Ключ</TableHead>
                <TableHead>Значение</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(body).map(([key, value], index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={key}
                      onChange={(e) => updateKey(index, e.target.value)}
                      placeholder="Введите ключ"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={value}
                      onChange={(e) => updateValue(index, e.target.value)}
                      placeholder="Введите значение"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEntry(index)}
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex gap-3 w-full">
          <Button
            className="mt-4 flex-1"
            variant="outline"
            onClick={() => setBody({ ...body, "": "" })}
          >
            Добавить
          </Button>
          <Button
            className="mt-4 flex-1"
            onClick={async () => {
                await requestService.approve(req_id, body)
            }}
          >
            Сохранить
          </Button>
          </div>
        </div>
      </div>
    </>
  );
}
