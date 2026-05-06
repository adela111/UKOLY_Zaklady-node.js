import test from 'ava'
import {app, db} from '../src/app.js'
import { sql } from 'drizzle-orm'

test.before(async () => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal'
    )
  `)
})

const createTodo = async (title, priority = 'normal') => {
  await app.request('/add-todo', {
    method: 'POST',
    body: new URLSearchParams({ title, priority }),
    headers: { 'Content-type': 'application/x-www-form-urlencoded' },
  })
  const page = await app.request('/')
  const text = await page.text()
  const match = text.match(new RegExp(`href="/todo/(\\d+)"[^>]*>\\s*${title}`))
  if (!match) throw new Error(`Could not find todo with title "${title}" on homepage`)
  return Number(match[1])
}

test.serial('GET / returns page with heading', async (t)=> {
    const response = await app.request('/')
    t.is(response.status, 200)
    const text = await response.text()
    t.assert(text.includes('Todos'), 'page should contain todos heading')
})


test.serial('POST / add-todo creates todo', async (t)=> {
    const title = 'test todo'
    const response = await app.request('/add-todo',{
        method: 'POST',
        body: new URLSearchParams({title}),
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
        },
    })
    t.is(response.status,302)

    const page = await app.request('/')
    const text = await page.text()
    t.assert(text.includes(title), 'todo should be visible on homepage')
})

test.serial('GET /todo/:id returns todo detail page', async (t) => {
  const id = await createTodo('Detail test')

  const response = await app.request(`/todo/${id}`)
  t.is(response.status, 200)
  const text = await response.text()
  t.assert(text.includes('Detail test'), 'detail page should show todo title')
})

test.serial('GET /todo/:id returns 404 for missing todo', async (t) => {
  const response = await app.request('/todo/99999')
  t.is(response.status, 404)
})

test.serial('GET /toggle-todo/:id toggles done state from false to true', async (t) => {
  const id = await createTodo('Toggle test')

  await app.request(`/toggle-todo/${id}`)

  const response = await app.request(`/todo/${id}`)
  const text = await response.text()

  t.assert(text.includes('Hotovo'), 'todo should be marked as hotovo')
  t.assert(text.includes('oznacit ako nehotove'), 'should show option to mark as nehotove')
})

test.serial('GET /toggle-todo/:id toggles done state from true to false', async (t) => {
  const id = await createTodo('Toggle back test')

  await app.request(`/toggle-todo/${id}`)
  await app.request(`/toggle-todo/${id}`)

  const response = await app.request(`/todo/${id}`)
  const text = await response.text()
  t.assert(text.includes('Nehotove'), 'todo should be marked as nehotove')
  t.assert(text.includes('oznacit ako hotove'), 'should show option to mark as hotovo')
})

test.serial('GET /remove-todo/:id deletes the todo', async (t) => {
  const id = await createTodo('Delete test')

  const response = await app.request(`/remove-todo/${id}`)
  t.is(response.status, 302)

  const page = await app.request('/')
  const text = await page.text()
  t.assert(!text.includes('Delete test'), 'deleted todo should not appear on homepage')
})

test.serial('POST /edit-todo/:id updates title and priority', async (t) => {
  const id = await createTodo('Old title')

  await app.request(`/edit-todo/${id}`, {
    method: 'POST',
    body: new URLSearchParams({ title: 'New title', priority: 'high' }),
    headers: { 'Content-type': 'application/x-www-form-urlencoded' },
  })

  const response = await app.request(`/todo/${id}`)
  const text = await response.text()
  t.assert(text.includes('New title'), 'detail page should show updated title')
  t.assert(text.includes('high'), 'detail page should show updated priority')
  t.assert(!text.includes('Old title'), 'old title should no longer appear')
})

test.serial('unknown route returns 404 page', async (t) => {
  const response = await app.request('/this-does-not-exist')
  t.is(response.status, 404)
})

test.serial('POST /add-todo sets default priority to normal', async (t) => {
  const id = await createTodo('Priority test')
  const response = await app.request(`/todo/${id}`)
  const text = await response.text()
  t.assert(text.includes('normal'), 'default priority should be normal')
})