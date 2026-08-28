// Управление токенами аутентификации
// Access token хранится только в памяти (защита от XSS)
// Refresh token в httpOnly cookie — управляется браузером автоматически

let accessToken: string | null = null;
let accessTokenExpiresAt: number = 0;

// Предупреждаем за 1 минуту до истечения
const REFRESH_BUFFER_SECONDS = 60;

/**
 * Устанавливает access token в память
 */
export function setAccessToken(token: string, expiresIn: number): void {
  accessToken = token;
  // Сохраняем момент когда токен истечёт (в миллисекундах)
  accessTokenExpiresAt = Date.now() + expiresIn * 1000;
}

/**
 * Возвращает access token или null если его нет или истёк
 */
export function getAccessToken(): string | null {
  if (!accessToken) return null;
  
  // Проверяем не истёк ли токен (с буфером)
  const bufferMs = REFRESH_BUFFER_SECONDS * 1000;
  if (Date.now() + bufferMs > accessTokenExpiresAt) {
    return null; // Токен истёк или скоро истечёт
  }
  
  return accessToken;
}

/**
 * Возвращает токен даже если он истёк (для отправки запроса который получит 401)
 */
export function getAccessTokenUnsafe(): string | null {
  return accessToken;
}

/**
 * Очищает access token (при logout)
 */
export function clearAccessToken(): void {
  accessToken = null;
  accessTokenExpiresAt = 0;
}

/**
 * Проверяет есть ли валидный токен в памяти
 * НЕ проверяет cookie — это невозможно из JS
 */
export function hasAccessToken(): boolean {
  return getAccessToken() !== null;
}
