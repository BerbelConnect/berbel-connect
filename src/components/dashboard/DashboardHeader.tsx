import { PageHeader } from "@/components/layout/PageHeader";

type DashboardHeaderProps = {
  titulo: string;
  subtitulo: string;
};

export function DashboardHeader({ titulo, subtitulo }: DashboardHeaderProps) {
  return <PageHeader titulo={titulo} subtitulo={subtitulo} />;
}
