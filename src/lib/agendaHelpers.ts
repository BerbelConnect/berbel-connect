export function moeda(valor: number | string | null | undefined): string {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function hojeISO(): string {
  return dataIsoBrasil();
}
import { dataIsoBrasil } from "./dataBrasil";
