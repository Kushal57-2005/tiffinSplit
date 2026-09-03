export function formatActivityAction(action, message = '') {
  if (!action) return '';

  if (action === 'MEAL_BULK_CREATED' || action === 'MEALS_ADDED') {
    if (/\b1 (meal|entry|tiffin)\b/i.test(message)) {
      return 'MEAL ADDED';
    }
    return 'MEALS ADDED';
  }

  if (action === 'MEAL_CREATED') {
    return 'MEAL ADDED';
  }

  return action.replace(/_/g, ' ');
}

export function formatActivityMessage(message = '') {
  if (!message) return '';
  return message
    .replace(/bulk imported 1 meal entries/gi, 'added 1 meal entry')
    .replace(/bulk imported (\d+) meal entries/gi, 'added $1 meal entries');
}
