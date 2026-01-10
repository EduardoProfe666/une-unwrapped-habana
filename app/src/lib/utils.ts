export const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "0 segundos";

  const minute = 60;
  const hour = 3600;
  const day = 86400;
  const month = 2592000;

  const months = Math.floor(seconds / month);
  let remainder = seconds % month;

  const days = Math.floor(remainder / day);
  remainder = remainder % day;

  const hours = Math.floor(remainder / hour);
  remainder = remainder % hour;

  const minutes = Math.floor(remainder / minute);
  const secs = Math.floor(remainder % minute);

  const parts = [];

  if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  if (secs > 0) parts.push(`${secs} ${secs === 1 ? 'segundo' : 'segundos'}`);

  return parts.join(', ');
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-ES').format(num);
};

export const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (e) {
    return dateStr;
  }
};