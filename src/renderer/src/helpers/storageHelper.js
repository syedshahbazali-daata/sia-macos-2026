import { encryptStorage } from './encryptStorage'

export const storage = {
  set: (key, value) => {
    if (typeof value === 'object') {
      try {
        value = JSON.stringify(value) // Stringify object before setting it in storage
      } catch (e) {
        console.error('Error stringifying object', e)
        return
      }
    }
    encryptStorage.setItem(key, value) // Store the stringified value (encrypts automatically)
  },

  get: (key, _default = null) => {
    const value = encryptStorage.getItem(key) // Decrypts automatically
    if (value === undefined || value === null) {
      return _default
    }
    return value
  },

  clear: () => {
    encryptStorage.clear() // Clear storage (encrypted storage)
  },

  getParsed: (key, _default = null) => {
    const value = encryptStorage.getItem(key) // Decrypts automatically

    if (value === undefined || value === null) {
      return _default
    }

    // encrypt-storage v2 auto-parses JSON on getItem, so the value may
    // already be an object. Only parse if it's still a string.
    if (typeof value === 'object') return value

    try {
      return JSON.parse(value)
    } catch (e) {
      return _default
    }
  }
}

export const enums = {
  INSTANCE: 'instance',
  LICENSE: 'license'
}
