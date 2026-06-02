require('dotenv').config()
const express = require('express')
const cors = require('cors')
const routes = require('./src/routes')
const setupMultiUser = require('./src/utils/setupMultiUser')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*', credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => res.json({ status: 'CREDIX API online', version: '2.0' }))
app.use('/api', routes)
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }))

app.listen(PORT, async () => {
  console.log(`🚀 CREDIX API rodando na porta ${PORT}`)
  await setupMultiUser()
})
