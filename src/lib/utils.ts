/**
 * Merges class names, filtering out falsy values.
 * Drop-in lightweight alternative to clsx + tailwind-merge.
 */
export function cn(...inputs: (string | undefined | null | false | 0)[]): string {
    return inputs.filter(Boolean).join(' ')
}

/**
 * Formats a date string or Date object into a readable locale string.
 * @param date - ISO string, Date, or null/undefined
 * @param options - Intl.DateTimeFormatOptions (defaults to dd/mm/yyyy)
 */
export function formatDate(
    date: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }
): string {
    if (!date) return '—'
    try {
        return new Intl.DateTimeFormat('es-CL', options).format(new Date(date))
    } catch {
        return String(date)
    }
}

/**
 * Formats a date string with time included.
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    return formatDate(date, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Truncates a string to a maximum length, appending '...' if truncated.
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return str.slice(0, maxLength) + '...'
}

/**
 * Returns initials from a full name (up to 2 characters).
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('')
}
