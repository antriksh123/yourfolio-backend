import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import router from './routes'

// Dot env
//import dotenv from 'dotenv'
//dotenv.config()

const PORT = process.env.PORT || 5000
const app = express()

// Middleware
app.use(express.json())
app.use(cors())

// Mongoose Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }, () => console.log("MongoDB Connected"))

app.use('/', router)

app.listen(PORT, () => console.log("Server is running on port " + PORT))
