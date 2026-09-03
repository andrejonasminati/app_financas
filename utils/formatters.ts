/**
 * Formata um valor numérico para o padrão de moeda brasileiro (BRL).
 * Exemplo: 1250.5 -> "R$ 1.250,50"
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data no formato YYYY-MM-DD para o padrão brasileiro DD/MM/YYYY.
 * Exemplo: "2026-05-15" -> "15/05/2026"
 */
export function formatDateBR(dateString: string | undefined | null): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}
