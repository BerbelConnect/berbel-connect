"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";

function baixarCSV(nomeArquivo: string, linhas: any[]) {
  if (!linhas.length) return alert("Nenhum dado encontrado.");

  const colunas = Object.keys(linhas[0]);

  const csv = [
    colunas.join(";"),
    ...linhas.map((linha) =>
      colunas.map((coluna) => `"${String(linha[coluna] ?? "").replace(/"/g, "'")}"`).join(";")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);
}

export default function ExportacoesPage() {
  const [carregando, setCarregando] = useState("");

  async function exportarPedidos() {
    setCarregando("pedidos");

    const { data, error } = await supabase
      .from("pedidos")
      .select("numero, data_pedido, status, tipo_operacao, valor_total, valor_comissao");

    setCarregando("");

    if (error) return alert(error.message);
    baixarCSV("pedidos.csv", data || []);
  }

  async function exportarClientes() {
    setCarregando("clientes");

    const { data, error } = await supabase
      .from("clientes")
      .select("razao_social, nome_fantasia, cnpj, responsavel, whatsapp, email, endereco, numero, bairro, cidade, estado");

    setCarregando("");

    if (error) return alert(error.message);
    baixarCSV("clientes.csv", data || []);
  }

  async function exportarComissoes() {
    setCarregando("comissoes");

    const { data, error } = await supabase
      .from("comissoes_financeiro")
      .select("empresa, produto_nome, percentual, valor_base, valor_comissao, status, data_recebimento");

    setCarregando("");

    if (error) return alert(error.message);
    baixarCSV("comissoes.csv", data || []);
  }

  async function exportarFinanceiro() {
    setCarregando("financeiro");

    const { data, error } = await supabase
      .from("contas_receber")
      .select("descricao, valor, vencimento, recebimento, status, forma_pagamento");

    setCarregando("");

    if (error) return alert(error.message);
    baixarCSV("contas-receber.csv", data || []);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        <Sidebar />

        <section className="flex-1">
          <PageHeader titulo="Central de Exportações" subtitulo="Berbel Connect" />

          <div className="p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Botao titulo="Pedidos" texto="Exportar pedidos em CSV" carregando={carregando === "pedidos"} onClick={exportarPedidos} />
              <Botao titulo="Clientes" texto="Exportar clientes em CSV" carregando={carregando === "clientes"} onClick={exportarClientes} />
              <Botao titulo="Comissões" texto="Exportar comissões em CSV" carregando={carregando === "comissoes"} onClick={exportarComissoes} />
              <Botao titulo="Financeiro" texto="Exportar contas a receber" carregando={carregando === "financeiro"} onClick={exportarFinanceiro} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Botao({
  titulo,
  texto,
  carregando,
  onClick,
}: {
  titulo: string;
  texto: string;
  carregando: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-white p-6 text-left shadow-sm hover:bg-slate-50"
    >
      <h3 className="text-xl font-bold text-slate-800">{titulo}</h3>
      <p className="mt-2 text-sm text-slate-500">{texto}</p>
      <p className="mt-5 font-semibold text-blue-700">
        {carregando ? "Gerando..." : "Exportar"}
      </p>
    </button>
  );
}