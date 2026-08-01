import { addDays, format } from 'date-fns'

export const LIFESPAN_OPTIONS = [14, 30, 60, 90]
export const DEFAULT_LIFESPAN_DAYS = 60
export const EXPIRY_WARNING_HOURS = 24 * 7

export const formatExpiryDate = (date: Date) => format(date, 'd MMMM yyyy')

export const expiryDateFor = (days: number) => formatExpiryDate(addDays(new Date(), days))

export const daysUntil = (expiresAt: string) =>
  Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000))

const wholeHours = (hoursLeft: number) => Math.max(1, Math.floor(hoursLeft))

export const countdownLabel = (hoursLeft: number) =>
  hoursLeft < 24
    ? `${wholeHours(hoursLeft)}h`
    : `${Math.floor(hoursLeft / 24)}d ${Math.floor(hoursLeft % 24)}h`

export const expiryWarningText = (hoursLeft: number) => {
  if (hoursLeft <= 0) return 'This board has expired and will be deleted.'
  const hours = wholeHours(hoursLeft)
  return `This board expires in ${hours} ${hours === 1 ? 'hour' : 'hours'} and will be deleted.`
}
