import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup requests interception using MSW
export const server = setupServer(...handlers)