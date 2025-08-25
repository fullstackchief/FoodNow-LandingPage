import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup the server with our request handlers
export const server = setupServer(...handlers)