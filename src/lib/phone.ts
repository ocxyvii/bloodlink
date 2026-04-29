const SOMALI_MOBILE_REGEX = /^(?:\+252|0|252)(6[1-9][0-9]{7}|9[0-9]{8})$/

export function validateSomaliPhone(phone: string): {
  valid: boolean
  formatted: string | null
  error: string | null
} {
  if (!phone || phone.trim() === '') {
    return { valid: true, formatted: null, error: null }
  }

  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  if (!SOMALI_MOBILE_REGEX.test(cleaned)) {
    return {
      valid: false,
      formatted: null,
      error: 'Enter a valid Somali mobile number e.g. 0612345678 or +252612345678',
    }
  }

  let digits = cleaned
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('0')) digits = '252' + digits.slice(1)

  return { valid: true, formatted: '+' + digits, error: null }
}