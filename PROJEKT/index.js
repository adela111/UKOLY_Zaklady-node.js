import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import ejs from 'ejs'

const app = new Hono()

let todos = [
  {
    id: 1,
    title: 'Dokoncit ukol z node.js',
    done: true,
  },
  {
    id: 2,
    title: 'Ist do prace',
    done: false,
  },
  {
    id: 3,
    title: 'Ist do skoly',
    done: false,
  },
]

app.get(async (c, next) => {
  console.log(c.req.method, c.req.url)
  await next()
})

app.get('/', async (c) => {
  const html = await ejs.renderFile('views/index.html', {
    name: 'Todos',
    todos,
  })

  return c.html(html)
})

app.post('/add-todo', async (c) => {
  const body = await c.req.formData()
  const title = body.get('title')
  const newId= todos.length>0? Math.max(...todos.map((t) => t.id)) + 1
      : 1

  todos.push({
    id: newId,
    title,
    done: false,
  })

  return c.redirect('/')
})

app.get('/remove-todo/:id', async (c) => {
  const id = Number(c.req.param('id'))

  todos = todos.filter((todo) => todo.id !== id)

  return c.redirect('/')
})

app.get('/toggle-todo/:id', async (c) => {
  const id = Number(c.req.param('id'))

  const todo = todos.find((todo) => todo.id === id)
  todo.done =!todo.done

  return c.redirect('/')
})

app.get('/todo/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const todo= todos.find((todo)=> todo.id===id)

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
  const body= await c.req.formData()
  const title = body.get('title')
  const todo= todos.find((todo)=> todo.id===id)

  if (todo) {
    todo.title = title
  }

  return c.redirect(`/todo/${id}`)
 })

app.notFound(async (c) => {
  const html = await ejs.renderFile('views/404.html')

  c.status(404)

  return c.html(html)
})

serve(app, (info) => {
  console.log(`Server started on http://localhost:${info.port}`)
})