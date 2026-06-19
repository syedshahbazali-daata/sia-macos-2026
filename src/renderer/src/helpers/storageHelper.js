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
      return _default // Return default if key does not exist
    }

    try {
      // Since `encryptStorage.getItem()` already returns a decrypted string,
      // You only need to parse it if it's in JSON format.
      return JSON.parse(value)
    } catch (e) {
      console.error('Error parsing JSON from decrypted storage', e)
      return _default // Return default if parsing fails
    }
  }
}

export const enums = {
  INSTANCE: 'instance',
  LICENSE: 'license'
}
