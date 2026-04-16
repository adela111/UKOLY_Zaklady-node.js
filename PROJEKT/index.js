import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import ejs from 'ejs'
import { drizzle } from "drizzle-orm/libsql"
import { todosTable } from './src/schema.js'
import {eq} from "drizzle-orm"
import { createNodeWebSocket } from '@hono/node-ws'
import { WSContext } from 'hono/ws'

const db = drizzle({
  connection: "file:db.sqlite",
  logger: true,
})

const app = new Hono()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

/**
 * @type {Set<WSContext<WebSocket>>}
 */

let webSockets = new Set()

app.get(
  '/ws',
  upgradeWebSocket((c) => ({
    onOpen: (evt, ws) => {
      webSockets.add(ws)
      console.log('open:',webSockets.size)
    },
    onClose: (evt, ws) => {
      webSockets.delete(ws)
      console.log('close')
    },
  })),
)

const sendTodosToAllWebsockets = async ()=>{
  try{
    const todos = await db.select().from(todosTable).all()
    const html = await ejs.renderFile('views/_todos.html',{
      todos,
    })

    for (const ws of webSockets){
      ws.send(
        JSON.stringify({
          type: 'todos',
          html,
        })
      )
    }
  } catch (e){
    console.log(e)
  }
}

const sendTodoDetailToAllWebsockets = async (id) => {
  try{
    const todo = await db.select().from(todosTable).where(eq(todosTable.id,id)).get()
    if (!todo) return
    const html = await ejs.renderFile('views/_todoDetail.html',{
      todo,
    })
    for (const ws of webSockets){
      ws.send(
        JSON.stringify({
          type: 'todo-detail',
          id,
          html,
        })
      )
    }
  } catch (e){
    console.log(e)
  }
}

const sendTodoDeletedToAllWebsockets = (id) => {
  for (const ws of webSockets){
    ws.send(JSON.stringify({
      type: 'todo-deleted',
      id,
    })
    )
  }
}

app.get(async (c, next) => {
  console.log(c.req.method, c.req.url)
  await next()
})

app.get('/', async (c) => {
  const todos = await db.select().from(todosTable).all()
  const html = await ejs.renderFile('views/index.html', {
    name: 'Todos',
    todos,
  })

  return c.html(html)
})

app.post('/add-todo', async (c) => {
  const body = await c.req.formData()
  const title = body.get('title')

  await db.insert(todosTable).values({
    title,
    done: false,
    priority: 'normal',
  })

  sendTodosToAllWebsockets()

  return c.redirect('/')
})

app.get('/remove-todo/:id', async (c) => {
  const id = Number(c.req.param('id'))

  await db.delete(todosTable).where(eq(todosTable.id,id))

  sendTodosToAllWebsockets()
  sendTodoDeletedToAllWebsockets(id)

  return c.redirect('/')
})

app.get('/toggle-todo/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const todo = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id,id))
    .get()
  if (!todo) return c.notFound()

  await db.update(todosTable)
  .set({done: !todo.done})
  .where(eq(todosTable.id,id))

  sendTodosToAllWebsockets()
  sendTodoDetailToAllWebsockets(id)

  return c.redirect('/')
})

app.get('/todo/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const todo = await db.select().from(todosTable).where(eq(todosTable.id,id)).get()

  if (!todo) {
    return c.text('Take todo nie je',404)
  }

  const html = await ejs.renderFile('views/todo.html', {
    todo,
  })

  return c.html(html)
 })

app.post('/edit-todo/:id', async (c) => {
  const id = Number(c.req.param('id'))

  const todo = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id,id))
    .get()

  if (!todo) return c.notFound()

  const body= await c.req.formData()
  const title = body.get('title')
  const priority = body.get('priority')
  await db.update(todosTable)
    .set({title, priority})
    .where(eq(todosTable.id, id))

  sendTodosToAllWebsockets()
  sendTodoDetailToAllWebsockets(id)

  return c.redirect(`/todo/${id}`)
 })

app.notFound(async (c) => {
  const html = await ejs.renderFile('views/404.html')

  c.status(404)

  return c.html(html)
})

const server = serve(app, (info) => {
  console.log(`Server started on http://localhost:${info.port}`)
})

injectWebSocket(server)