import type { ProdutoMaisComprado } from "@/types/historicoCliente";
import { moeda } from "./fichaHelpers";

export function FichaProdutosTab({ produtos }: { produtos: ProdutoMaisComprado[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Produtos</h3>
          <p className="text-sm text-slate-500">Principais produtos comprados pelo cliente.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
          Top {produtos.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Comissão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {produtos.length > 0 ? (
              produtos.map((item) => (
                <tr key={item.produto_nome}>
                  <td className="px-4 py-4 font-semibold text-slate-800">{item.produto_nome}</td>
                  <td className="px-4 py-4">{item.quantidade}</td>
                  <td className="px-4 py-4 font-semibold text-slate-900">{moeda(item.valor_total)}</td>
                  <td className="px-4 py-4 font-semibold text-green-700">{moeda(item.comissao_total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
