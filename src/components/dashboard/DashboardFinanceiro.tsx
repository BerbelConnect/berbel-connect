import type {
  DashboardContaReceberResumo,
  DashboardComissaoPendenteResumo,
} from "@/types/dashboard";

type DashboardFinanceiroProps = {
  contasReceberPendentes: DashboardContaReceberResumo[];
  comissoesPendentes: DashboardComissaoPendenteResumo[];
};

function Painel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-xl font-bold text-slate-800">{titulo}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Item({ titulo, subtitulo, detalhe }: { titulo: string; subtitulo: string; detalhe: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-bold text-slate-800">{titulo}</p>
      <p className="text-sm text-slate-500">{subtitulo}</p>
      <p className="mt-2 text-sm font-semibold text-blue-700">{detalhe}</p>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-slate-500">{texto}</p>;
}

export function DashboardFinanceiro({ contasReceberPendentes, comissoesPendentes }: DashboardFinanceiroProps) {
  return (
    <>
      <Painel titulo="Contas a receber">
        {contasReceberPendentes.map((item) => (
          <Item
            key={item.id}
            titulo={item.descricao || "Conta a receber"}
            subtitulo={item.cliente_nome || "-"}
            detalhe={`R$ ${item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
          />
        ))}
        {contasReceberPendentes.length === 0 && <Vazio texto="Nenhuma conta pendente." />}
      </Painel>

      <Painel titulo="Comissões pendentes">
        {comissoesPendentes.map((item) => (
          <Item
            key={item.id}
            titulo={item.empresa || "Representada"}
            subtitulo={item.cliente_nome || "-"}
            detalhe={`R$ ${item.valor_comissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}
          />
        ))}
        {comissoesPendentes.length === 0 && <Vazio texto="Nenhuma comissão pendente." />}
      </Painel>
    </>
  );
}
