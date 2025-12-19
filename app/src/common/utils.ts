export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days} días`);
  if (hours > 0) parts.push(`${hours} horas`);
  if (minutes > 0) parts.push(`${minutes} minutos`);
  if (secs > 0) parts.push(`${secs} segundos`);

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