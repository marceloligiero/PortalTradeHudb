import { TFunction } from 'i18next';

/**
 * Traduz o nome de um produto/serviço baseado no código.
 * Se não encontrar tradução, retorna o nome original do banco de dados.
 */
export function getTranslatedProductName(
  t: TFunction,
  code?: string,
  fallbackName?: string
): string {
  if (!code) return fallbackName || '';
  
  const key = `productNames.${code}`;
  const translated = t(key);
  
  // Se a tradução retornar a própria chave, significa que não existe tradução
  if (translated === key) {
    return fallbackName || code;
  }
  
  return translated;
}
