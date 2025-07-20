require('dotenv').config()

const express = require('express')
const app = express()
const PORT = 4000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/twitter', (req, res) => {
    res.send('Twitter nahi chalta abhi');
})

app.get('/login', (req, res) => {
    res.send('<h1>Please login first</h1>')
})

app.get('/youtube', (req, res) => {
    res.send('<h2>Youtube bhi nhi chalta</h2>')
})

app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`)
})