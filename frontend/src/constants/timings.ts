/**
 * Constantes de tempo (ms) centralizadas.
 * Evita magic numbers de setTimeout/setInterval espalhados pelo código.
 */

/** Delay de navegação após guardar um formulário com sucesso */
export const NAVIGATE_AFTER_SAVE_MS = 1500;

/** Delay de navegação após submeter (ex: planos de formação) */
export const NAVIGATE_AFTER_SUBMIT_MS = 2000;

/** Intervalo de polling para notificações não lidas no Header */
export const NOTIFICATIONS_POLL_MS = 30_000; // 30 segundos

/** Delay para exibir mensagem de sucesso antes de limpar */
export const SUCCESS_MESSAGE_CLEAR_MS = 3000;

/** Delay de animação para remover item da lista após ação */
export const LIST_ITEM_REMOVE_DELAY_MS = 300;

/** Delay para foco em inputs */
export const INPUT_FOCUS_DELAY_MS = 200;
export const INPUT_FOCUS_DELAY_SHORT_MS = 50;
