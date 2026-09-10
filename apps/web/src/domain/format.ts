const RUB_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

export const formatRub = (valueInKopeks: number): string => {
  return RUB_FORMATTER.format(valueInKopeks / 100);
};
