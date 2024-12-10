export const formatDueDate = (dueDate: string) => {
  const due = new Date(dueDate);
  const dueUTC = new Date(due.getTime() + due.getTimezoneOffset() * 60000);
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  // Reset all times to start of day in local timezone
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  dueUTC.setHours(0, 0, 0, 0);

  if (dueUTC.getTime() === today.getTime()) return 'Today';
  if (dueUTC.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (dueUTC.getTime() === dayAfterTomorrow.getTime()) return 'In 2 Days';
  
  return dueUTC.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const getDueDateColor = (dueDate: string) => {
  const due = new Date(dueDate);
  const dueUTC = new Date(due.getTime() + due.getTimezoneOffset() * 60000);
  
  const today = new Date();
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  twoDaysFromNow.setHours(23, 59, 59, 999);

  return dueUTC.getTime() <= twoDaysFromNow.getTime()
    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
}; 