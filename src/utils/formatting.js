export const format = value => Number(value || 0).toLocaleString('ru-RU', {
  maximumFractionDigits: 2
});

export const formatDate = value => {
  if (!value) return 'Без даты';
  const [year, month, day] = String(value).split('-');
  return year && month && day ? `${day}.${month}.${year}` : value;
};
