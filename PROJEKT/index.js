import { serve } from '@hono/node-server'
import { app } from "./src/app.js"
import { createNodeWebSocket } from '@hono/node-ws'

const { injectWebSocket} = createNodeWebSocket({ app })

const server = serve(app, (info) => {
  console.log(`Server started on http://localhost:${info.port}`)
})

injectWebSocket(server)