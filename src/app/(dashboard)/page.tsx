import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader name="Управление заявками" />
        <div className="mx-auto max-w-[800px]">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Пользователь</TableHead>
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
                  <Badge className="bg-amber-500 text-white">
                    Ожидает
                  </Badge>
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button>Принять</Button>
                  <Button variant="destructive">Отклонить</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
