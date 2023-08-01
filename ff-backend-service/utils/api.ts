import axios from 'axios'

export const algorithmServer = axios.create({
  baseURL: process.env.ALGORITHM_SERVER_URL,
})
