export function validateRequired(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function validateEmail(email) {
  if (!validateRequired(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

export function validatePassword(password) {
  if (!validateRequired(password)) return false;
  return String(password).length >= 6;
}

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function validatePhone(phone) {
  const digits = onlyDigits(phone);
  return digits.length >= 10 && digits.length <= 11;
}

// Nao valida CPF/CNPJ real, apenas formato basico por quantidade de digitos
export function validateDocument(documento) {
  const digits = onlyDigits(documento);
  return digits.length === 11 || digits.length === 14;
}

export function validateCep(cep) {
  const digits = onlyDigits(cep);
  return digits.length === 8;
}

export function parsePrice(value) {
  const normalized = String(value || '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : NaN;
}

export function validatePrice(value) {
  const num = parsePrice(value);
  return Number.isFinite(num) && num > 0;
}

export function validateShoeSize(value) {
  const cleaned = String(value || '').replace(',', '.').trim();
  if (!cleaned) return false;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 10 && num <= 60;
}
