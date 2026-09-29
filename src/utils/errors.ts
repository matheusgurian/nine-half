const ERROR_MAP: Record<string, string> = {
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique sua rede e tente novamente.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/user-not-found': 'Conta não encontrada para este e-mail.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/email-already-in-use': 'Este e-mail já está em uso.',
  'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'permission-denied': 'Você não tem permissão para esta ação.',
  'failed-precondition': 'Configuração incompleta no Firebase. Verifique os índices e as regras.',
  'unavailable': 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  'not-found': 'Registro não encontrado.',
  'already-exists': 'Este registro já existe.',
  'invalid-argument': 'Dados inválidos. Revise os campos e tente novamente.'
};

function extractErrorCode(err: any): string {
  if (!err) return '';
  const directCode = String(err?.code || '').trim();
  if (directCode) return directCode;

  const msg = String(err?.message || '');
  const match = msg.match(/\(([a-z-]+\/[a-z-]+)\)/i);
  if (match?.[1]) return match[1].toLowerCase();

  return '';
}

function normalizeRawMessage(message: string): string {
  return message
    .replace(/^Firebase:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

export function getErrorMessage(error: any) {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.';

  if (typeof error === 'string') {
    const normalized = normalizeRawMessage(error);
    return normalized || 'Ocorreu um erro inesperado. Tente novamente.';
  }

  const code = extractErrorCode(error);
  if (code && ERROR_MAP[code]) {
    return ERROR_MAP[code];
  }

  const rawMessage = normalizeRawMessage(String(error?.message || ''));
  if (rawMessage) return rawMessage;

  return 'Ocorreu um erro inesperado. Tente novamente.';
}
