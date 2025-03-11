import express, { Request, Response } from 'express'
import cors from 'cors'
import { createLogger, format, transports } from 'winston'

interface DateRequest {
  dates: string[]
}

interface DateObject {
  formattedDate: string
}

interface DateResponse {
  formattedDates: DateObject[]
}

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Omega API')
})

app.post('/epoch', (req: Request, res: Response): void => {
  const { todaysDateUTC, forwardDays } = req.body

  if (!todaysDateUTC || typeof forwardDays !== 'number') {
    res.status(400).json({
      error: 'Invalid input. Provide todaysDateUTC (string) and forwardDays (number).',
    })
  }

  const startDate = new Date(todaysDateUTC)
  if (isNaN(startDate.getTime())) {
    res.status(400).json({
      error: 'Invalid input. Provide todaysDateUTC (string) and forwardDays (number).',
    })
  }

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + forwardDays)

  const startDateEpoch = startDate.getTime()

  const endDateEpoch = endDate.getTime()

  res.json({
    todaysDateUTC,
    startDateEpoch,
    endDate: endDate.toISOString(),
    endDateEpoch,
  })
})

app.post('/agentus/convert-dates', (req: Request, res: Response): void => {
  const request = req.body as DateRequest

  if (!request.dates || !Array.isArray(request.dates)) {
    res.status(400).send('Invalid request payload')
    return
  }

  const formattedDates: DateObject[] = []

  for (const dateStr of request.dates) {
    const [year, month, day] = dateStr.split('-').map(Number)

    const parsedDate = new Date(year, month - 1, day)

    if (isNaN(parsedDate.getTime())) {
      res.status(400).send('Invalid date format')
      return
    }

    const formattedDate = parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    formattedDates.push({ formattedDate })
  }

  const response: DateResponse = { formattedDates }
  res.json(response)
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
