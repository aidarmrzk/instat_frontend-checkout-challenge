import type { Cart, Product } from '../../domain/types';

const toMapBy = <T>(items: readonly T[], keySelector: (item: T) => string): Map<string, T> => {
  return items.reduce((map, item) => map.set(keySelector(item), item), new Map<string, T>());
};

export const toProductIdMap = (items: Cart['items']): Map<string, Cart['items'][number]> => {
  return toMapBy(items, (item) => item.productId);
};

export const toProductsMap = (items: Product[]): Map<string, Product> => {
  return toMapBy(items, (item) => item.id);
};
