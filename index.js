require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

const app = express()

morgan.token('body', (req) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body)
  }
})

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
)

app.get('/', (request, response) => {
  response.end('API REST Phonebook made for Jesus Piscoya')
})

app.get('/info', (request, response) => {
  const date = new Date()
  Person.find({}).then((persons) => {
    response.send(`
      <p>Phonebook has info for ${persons.length} people</p>
      <p>${date}</p>
    `)
  })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((persons) => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      person
        ? response.json(person)
        : response.status(404).json({ error: 'Person not found' })
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => next(error))
})

app.post('/api/persons', async (request, response, next) => {
  const person = new Person(request.body)

  person
    .save()
    .then((savedPerson) => {
      response.status(201).json(savedPerson)
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
    context: 'query',
  })
    .then((updatedNote) => {
      response.status(201).json(updatedNote)
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'Unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  console.log('Error name:', error.errors)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'Malformatted id' })
  } else if (error.name === 'MongoServerError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
