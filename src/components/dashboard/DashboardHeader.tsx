import { PageHeader } from "@/components/layout/PageHeader";

type DashboardHeaderProps = {
  titulo: string;
  subtitulo: string;
  saudacao?: string;
  ultimaAtualizacao?: string | null;
};

export function DashboardHeader({ titulo, subtitulo, saudacao, ultimaAtualizacao }: DashboardHeaderProps) {
  return (
    <PageHeader
      titulo={titulo}
      subtitulo={subtitulo}
      saudacao={saudacao}
      ultimaAtualizacao={ultimaAtualizacao}
    />
  );
}
