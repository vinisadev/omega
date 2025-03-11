import express, { Request, Response } from 'express'
import cors from 'cors'
import winston from 'winston'
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

// Configure logger
const logger = createLogger({
  level: 'debug',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    // Add BetterStack transport here if needed
  ],
})

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
  logger.info('[GET /]')
  res.send('Welcome to Omega API')
})

app.post('/epoch', (req: Request, res: Response): void => {
  logger.info('Request Received')

  const { todaysDateUTC, forwardDays } = req.body

  if (!todaysDateUTC || typeof forwardDays !== 'number') {
    res.status(400).json({
      error: 'Invalid input. Provide todaysDateUTC (string) and forwardDays (number).',
    })
  }

  logger.info('Request Body Parsed')

  const startDate = new Date(todaysDateUTC)
  if (isNaN(startDate.getTime())) {
    res.status(400).json({
      error: 'Invalid input. Provide todaysDateUTC (string) and forwardDays (number).',
    })
  }

  logger.info('Date Validity Checked')

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + forwardDays)
  logger.info('Date Range Created')

  const startDateEpoch = startDate.getTime()
  logger.info('Start Date Converted')

  const endDateEpoch = endDate.getTime()
  logger.info('End Date Converted')

  logger.info('Response Sent', {
    todaysDateUTC,
    startDateEpoch,
    endDateEpoch,
    forwardDays,
    ipAddress: req.ip,
    rawBody: JSON.stringify(req.body),
  })

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
