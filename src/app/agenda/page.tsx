"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { AgendaCards, AgendaFilters, AgendaForm, AgendaTable } from "@/components/agenda";
import type {
  AgendaCliente,
  AgendaVisita,
  AgendaVisitaFormData,
} from "@/types/agenda";
import {
  carregarClientes,
  carregarVisitas,
  concluirVisita as concluirVisitaService,
  excluirVisita as excluirVisitaService,
  salvarVisita as salvarVisitaService,
  filtrarVisitas,
  gerarResumo,
} from "@/services/agenda";
import { hojeISO } from "@/lib/agendaHelpers";

const inicial: AgendaVisitaFormData = {
  cliente_id: "",
  data_visita: hojeISO(),
  hora_visita: "",
  tipo_contato: "Presencial",
  bairro: "",
  status: "Agendada",
  resultado: "",
  oportunidade: "",
  valor_potencial: "",
  observacoes: "",
  alerta_retorno: false,
};

export default function AgendaPage() {
  const [clientes, setClientes] = useState<AgendaCliente[]>([]);
  const [visitas, setVisitas] = useState<AgendaVisita[]>([]);
  const [form, setForm] = useState<AgendaVisitaFormData>(inicial);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarDados() {
    try {
      const clientesData = await carregarClientes();
      setClientes(clientesData);
    } catch (error) {
      alert((error as Error).message || "Erro ao carregar clientes.");
      return;
    }

    try {
      const visitasData = await carregarVisitas();
      setVisitas(visitasData);
    } catch (error) {
      alert((error as Error).message || "Erro ao carregar visitas.");
    }
  }

  useEffect(() => {
    async function carregarDadosEffect() {
      await carregarDados();
    }

    carregarDadosEffect();
  }, []);

  async function handleSalvarVisita() {
    if (!form.cliente_id) return alert("Selecione o cliente.");
    if (!form.data_visita) return alert("Informe a data da visita.");

    setCarregando(true);
    const error = await salvarVisitaService(form);
    setCarregando(false);

    if (error) return alert(error.message);

    setForm(inicial);
    carregarDados();
  }

  function handleEditarVisita(visita: AgendaVisita) {
    setForm({
      id: visita.id,
      cliente_id: visita.cliente_id,
      data_visita: visita.data_visita || hojeISO(),
      hora_visita: visita.hora_visita || "",
      tipo_contato: visita.tipo_contato || "Presencial",
      bairro: visita.bairro || "",
      status: visita.status || "Agendada",
      resultado: visita.resultado || "",
      oportunidade: visita.oportunidade || "",
      valor_potencial: String(visita.valor_potencial || ""),
      observacoes: visita.observacoes || "",
      alerta_retorno: visita.alerta_retorno || false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleConcluirVisita(visita: AgendaVisita) {
    const error = await concluirVisitaService(visita);
    if (error) return alert(error.message);
    carregarDados();
  }

  async function handleExcluirVisita(id: string) {
    if (!confirm("Deseja excluir esta visita?")) return;

    const error = await excluirVisitaService(id);
    if (error) return alert(error.message);

    carregarDados();
  }

  const visitasFiltradas = useMemo(
    () => filtrarVisitas(visitas, busca),
    [visitas, busca]
  );

  const resumo = useMemo(() => gerarResumo(visitasFiltradas), [visitasFiltradas]);

  const hoje = hojeISO();

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Agenda Inteligente" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
              <AgendaCards
                hojeCount={resumo.hojeCount}
                atrasadasCount={resumo.atrasadasCount}
                proximasCount={resumo.proximasCount}
                concluidasCount={resumo.concluidasCount}
                potencialTotal={resumo.potencialTotal}
              />
            </div>

            <AgendaForm
              clientes={clientes}
              form={form}
              carregando={carregando}
              onChange={setForm}
              onSubmit={handleSalvarVisita}
              onClear={() => setForm(inicial)}
            />

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <AgendaFilters busca={busca} onBuscaChange={setBusca} />

              <AgendaTable
                visitas={visitasFiltradas}
                hoje={hoje}
                onEdit={handleEditarVisita}
                onConcluir={handleConcluirVisita}
                onDelete={handleExcluirVisita}
              />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
