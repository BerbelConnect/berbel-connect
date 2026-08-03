"use client";

type BaseRankingItem = {
  nome: string;
};

type ClienteRankingItem = BaseRankingItem & {
  total: number;
  pedidos: number;
};

type ProdutoRankingItem = BaseRankingItem & {
  total: number;
  quantidade: number;
};

type RepresentadaRankingItem = BaseRankingItem & {
  total: number;
  comissao: number;
};

type Props = {
  titulo: string;
  tipo: "clientes" | "produtos" | "representadas";
  dados:
    | ClienteRankingItem[]
    | ProdutoRankingItem[]
    | RepresentadaRankingItem[];
};

function formatCurrency(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ReportsRanking({
  titulo,
  tipo,
  dados,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">
          {titulo}
        </h2>
      </div>

      <div className="space-y-3">
        {dados.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            Nenhum dado encontrado.
          </div>
        )}

        {dados.map((item, index) => (
          <div
            key={`${item.nome}-${index}`}
            className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {index + 1}. {item.nome}
                </p>

                {tipo === "clientes" && (
                  <>
                    <p className="text-sm text-slate-500">
                      Pedidos: {(item as ClienteRankingItem).pedidos}
                    </p>

                    <p className="mt-1 font-semibold text-blue-700">
                      {formatCurrency(
                        (item as ClienteRankingItem).total
                      )}
                    </p>
                  </>
                )}

                {tipo === "produtos" && (
                  <>
                    <p className="text-sm text-slate-500">
                      Quantidade: {(item as ProdutoRankingItem).quantidade}
                    </p>

                    <p className="mt-1 font-semibold text-blue-700">
                      {formatCurrency(
                        (item as ProdutoRankingItem).total
                      )}
                    </p>
                  </>
                )}

                {tipo === "representadas" && (
                  <>
                    <p className="text-sm text-slate-500">
                      Valor Base: {formatCurrency(
                        (item as RepresentadaRankingItem).total
                      )}
                    </p>

                    <p className="mt-1 font-semibold text-green-700">
                      Comissão: {formatCurrency(
                        (item as RepresentadaRankingItem).comissao
                      )}
                    </p>
                  </>
                )}
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                {index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}