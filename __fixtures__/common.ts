import { jest } from '@jest/globals'

export const dedupeExact =
  jest.fn<typeof import('../src/common.js').dedupeExact>()
