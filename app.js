const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
var isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const convertDbObjecttoresponseObj = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasTodoProperty = requestQuery => {
  return requestQuery.todo !== undefined
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityAndCategoryProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  )
}
//API 1

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TODO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
SELECT * FROM todo WHERE status='${status}' AND priority='${priority}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasCategoryAndStatusProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TODO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `
SELECT * FROM todo WHERE category='${category}' AND status='${status}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Category')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasPriorityAndCategoryProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          category === 'WORK' ||
          category === 'HOME' ||
          category === 'LEARNING'
        ) {
          getTodosQuery = `
SELECT * FROM todo WHERE priority='${priority}' AND category='${category}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}'`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `SELECT * FROM todo WHERE status='${status}'`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo like '%${search_q}%';`
      data = await db.all(getTodosQuery)
      response.send(
        data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
      )
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category='${category}'`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = `select * from todo`
      data = await db.all(getTodosQuery)
      response.send(
        data.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
      )
  }
})

//API 2

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
SELECT
*
FROM todo
WHERE
id=${todoId};`
  const todoArray = await db.get(getTodoQuery)
  response.send(convertDbObjecttoresponseObj(todoArray))
})
//3 API

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    console.log(new Date())
    const requestedDate = `SELECT * FROM todo WHERE due_date='${newDate}';`
    const responseDate = await db.all(requestedDate)
    response.send(
      responseDate.map(eachItem => convertDbObjecttoresponseObj(eachItem)),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//4 API

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const addTodoQuery = `
INSERT INTO
todo(id,todo,priority,status,category,due_date)
VALUES
(${id}, '${todo}', '${priority}', '${status}', '${category}', '${postDueDate}');`
          await db.run(addTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 5

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  console.log(requestBody)
  let updateColumn = ''
  const previousTodoQuery = `
SELECT
*
FROM
todo
WHERE
id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    status = previousTodo.status,
    priority = previousTodo.priority,
    dueDate = previousTodo.dueDate,
  } = request.body
  let updateQuery
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateQuery = `
UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
WHERE id=${todoId};`
        await db.run(updateQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateQuery = `
UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
WHERE id=${todoId};`
        await db.run(updateQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestBody.todo !== undefined:
      updateQuery = `
UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
WHERE id=${todoId};`
      await db.run(updateQuery)
      response.send('Todo Updated')
      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateQuery = `
UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${dueDate}'
WHERE id=${todoId};`
        await db.run(updateQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateQuery = `
UPDATE todo SET todo='${todo}',priority='${priority}',status='${status}',category='${category}',due_date='${newDueDate}'
WHERE id=${todoId};`
        await db.run(updateQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

//API 6

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
DELETE FROM
todo
WHERE
id=${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
