import type { Customer } from '@checkout/contracts';
import type { AppError } from '../../api/errors';
import type { DeliveryForm } from '../../domain/types';

export type FieldErrors = Record<string, string>;
export type CheckoutFieldKey = 'name' | 'email' | 'phone' | 'city' | 'street' | 'house';

export const FIELD_MESSAGES: Record<CheckoutFieldKey, string> = {
  name: 'Введите имя',
  email: 'Проверьте email',
  phone: 'Телефон в формате +79990000000',
  city: 'Укажите город',
  street: 'Укажите улицу',
  house: 'Укажите дом',
};

const FIELD_PATH_TO_KEY: ReadonlyArray<readonly [string, CheckoutFieldKey]> = [
  ['/customer/name', 'name'],
  ['/customer/email', 'email'],
  ['/customer/phone', 'phone'],
  ['/delivery/address/city', 'city'],
  ['/delivery/address/street', 'street'],
  ['/delivery/address/house', 'house'],
];

export const mapFieldErrors = (error: AppError): FieldErrors => {
  return error.fields.reduce<FieldErrors>((fieldErrors, field) => {
    const matched = FIELD_PATH_TO_KEY.find(([path]) => field.path.includes(path));
    if (!matched) {
      return fieldErrors;
    }

    const [, key] = matched;
    fieldErrors[key] = FIELD_MESSAGES[key];
    return fieldErrors;
  }, {});
};

export const validateCheckoutForm = (customer: Customer, delivery: DeliveryForm): FieldErrors => {
  const nextErrors: FieldErrors = {};

  if (!customer.name.trim()) {
    nextErrors.name = FIELD_MESSAGES.name;
  }

  if (!customer.email.includes('@')) {
    nextErrors.email = FIELD_MESSAGES.email;
  }

  if (!/^\+[1-9]\d{9,14}$/.test(customer.phone)) {
    nextErrors.phone = FIELD_MESSAGES.phone;
  }

  if (delivery.method === 'courier') {
    if (!delivery.address.city.trim()) {
      nextErrors.city = FIELD_MESSAGES.city;
    }

    if (!delivery.address.street.trim()) {
      nextErrors.street = FIELD_MESSAGES.street;
    }

    if (!delivery.address.house.trim()) {
      nextErrors.house = FIELD_MESSAGES.house;
    }
  }

  return nextErrors;
};
