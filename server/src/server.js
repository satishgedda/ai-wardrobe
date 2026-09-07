const app = require('./app')
const env = require('./config/env')
const { connectDatabase, disconnectDatabase } = require('./config/database')

let server

async function startServer() {
  env.validateEnvironment()
  const databaseConnected = await connectDatabase()
  server = app.listen(env.port, () => {
    console.info(JSON.stringify({ event: 'server_started', port: env.port, environment: env.nodeEnv, databaseConnected }))
  })
}

async function shutdown(signal) {
  console.info(JSON.stringify({ event: 'shutdown_started', signal }))
  if (server) await new Promise((resolve) => server.close(resolve))
  await disconnectDatabase()
  process.exit(0)
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))

startServer().catch((error) => {
  console.error('Failed to start server', error)
  process.exit(1)
})