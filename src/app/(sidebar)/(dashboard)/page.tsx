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

export default function Page() {
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
              <TableRow>
                <TableCell className="font-medium">Иван</TableCell>
                <TableCell>BD_USERNAME</TableCell>
                <TableCell>
                  <Badge className="bg-amber-500 text-white">Ожидает</Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button>Принять</Button>
                  <Button variant="destructive">Отклонить</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
