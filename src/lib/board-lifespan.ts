import { addDays, format } from 'date-fns'

export const LIFESPAN_OPTIONS = [14, 28, 60]
export const DEFAULT_LIFESPAN_DAYS = 60
export const EXPIRY_WARNING_HOURS = 24 * 7

export const formatExpiryDate = (date: Date) => format(date, 'd MMMM yyyy')

export const expiryDateFor = (days: number) => formatExpiryDate(addDays(new Date(), days))

export const daysUntil = (expiresAt: string) =>
  Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 86400000))

const wholeMinutes = (hoursLeft: number) => Math.max(1, Math.round(hoursLeft * 60))

export const countdownLabel = (hoursLeft: number) => {
  if (hoursLeft < 1) return `${wholeMinutes(hoursLeft)}m`
  const hours = Math.round(hoursLeft)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export const expiryWarningText = (hoursLeft: number) => {
  if (hoursLeft <= 0) return 'This board has expired and will be deleted.'
  if (hoursLeft < 1) {
    const minutes = wholeMinutes(hoursLeft)
    return `This board expires in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and will be deleted.`
  }
  const hours = Math.round(hoursLeft)
  return `This board expires in ${hours} ${hours === 1 ? 'hour' : 'hours'} and will be deleted.`
}
