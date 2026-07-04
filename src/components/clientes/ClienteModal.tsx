"use client";

import { useEffect, type FormEvent } from "react";
import type { Cliente, ClienteFormData } from "@/types/cliente";
import { emptyClienteForm } from "@/types/cliente";

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

type ClienteModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteFormData) => void;
  initialData?: Cliente;
  mode: "create" | "edit";
};

type FieldConfig = {
  name: keyof ClienteFormData;
  label: string;
  type?: "text" | "email" | "textarea" | "select";
  colSpan?: 1 | 2;
};

const fields: FieldConfig[] = [
  { name: "razaoSocial", label: "Razão Social", colSpan: 2 },
  { name: "nomeFantasia", label: "Nome Fantasia", colSpan: 2 },
  { name: "cnpj", label: "CNPJ" },
  { name: "inscricaoEstadual", label: "Inscrição Estadual" },
  { name: "responsavel", label: "Responsável" },
  { name: "cargo", label: "Cargo" },
  { name: "telefone", label: "Telefone" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "email", label: "Email", type: "email", colSpan: 2 },
  { name: "cep", label: "CEP" },
  { name: "endereco", label: "Endereço" },
  { name: "numero", label: "Número" },
  { name: "bairro", label: "Bairro" },
  { name: "cidade", label: "Cidade" },
  { name: "estado", label: "Estado", type: "select" },
  { name: "materiaisUtilizados", label: "Materiais Utilizados", type: "textarea", colSpan: 2 },
  { name: "fornecedoresAtuais", label: "Fornecedores Atuais", type: "textarea", colSpan: 2 },
  { name: "observacoes", label: "Observações", type: "textarea", colSpan: 2 },
];

function clienteToForm(cliente: Cliente): ClienteFormData {
  const { id, ultimaVisita, status, ...form } = cliente;
  void id;
  void ultimaVisita;
  void status;
  return form;
}

export function ClienteModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ClienteModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const defaultValues = initialData ? clienteToForm(initialData) : emptyClienteForm;
  const title = mode === "create" ? "Novo Cliente" : "Editar Cliente";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as ClienteFormData;
    onSubmit(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cliente-modal-title"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 id="cliente-modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Preencha os dados do cliente abaixo
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form
          key={initialData?.id ?? "new"}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={field.colSpan === 2 ? "sm:col-span-2" : undefined}
                >
                  <label
                    htmlFor={field.name}
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    {field.label}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      rows={3}
                      defaultValue={defaultValues[field.name]}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={field.name}
                      name={field.name}
                      defaultValue={defaultValues[field.name]}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Selecione</option>
                      {estados.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type ?? "text"}
                      defaultValue={defaultValues[field.name]}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {mode === "create" ? "Cadastrar Cliente" : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
