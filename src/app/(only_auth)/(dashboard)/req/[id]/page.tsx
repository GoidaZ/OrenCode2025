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

  const [nextId, setNextId] = useState(0);
  const [entries, setEntries] = useState<Array<{ id: number; key: string; value: string }>>([]);

  useState(() => {
    const initialEntries = Object.entries(body).map(([key, value], index) => ({
      id: index,
      key,
      value,
    }));
    setEntries(initialEntries);
    setNextId(initialEntries.length);
  });

  const updateKey = (id: number, newKey: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, key: newKey } : entry
    ));
  };

  const updateValue = (id: number, newValue: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, value: newValue } : entry
    ));
  };

  const removeEntry = (id: number) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const addEntry = () => {
    const newId = nextId;
    setNextId(prev => prev + 1);
    setEntries(prev => [...prev, { id: newId, key: "", value: "" }]);
  };

  const convertToBody = () => {
    const result: Record<string, string> = {};
    entries.forEach(entry => {
      if (entry.key.trim() !== "") {
        result[entry.key] = entry.value;
      }
    });
    return result;
  };

  const handleSave = async () => {
    const finalBody = convertToBody();
    await requestService.approve(req_id, finalBody);
  };

  if (!data) return <>Loading...</>;

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
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Input
                      value={entry.key}
                      onChange={(e) => updateKey(entry.id, e.target.value)}
                      placeholder="Введите ключ"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.value}
                      onChange={(e) => updateValue(entry.id, e.target.value)}
                      placeholder="Введите значение"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
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
              onClick={addEntry}
            >
              Добавить
            </Button>
            <Button
              className="mt-4 flex-1"
              onClick={handleSave}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}