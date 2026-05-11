import { createServer } from 'http'
import { config } from './core/config/index.js'
import { connectDB } from './core/database/index.js'
import { initSocket } from './core/socket.js'
import app from './app.js'

const httpServer = createServer(app)

async function start() {
  await connectDB()
  
  initSocket(httpServer)

  httpServer.listen(config.port, () => {
    console.log(`ChargeNexus API running on http://localhost:${config.port}`)
  })
}

start()
