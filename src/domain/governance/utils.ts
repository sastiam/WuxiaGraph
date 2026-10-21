/**
 * Normaliza una fecha dada (por defecto la fecha actual) al inicio de la semana (Lunes) en formato YYYY-MM-DD.
 */
export function getStartOfWeek(inputDate: Date = new Date()): string {
  const d = new Date(inputDate);
  const day = d.getDay();
  // En JS: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado.
  // Ajuste para que Lunes sea el primer día de la semana (offset = 0)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dateStr = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${dateStr}`;
}
