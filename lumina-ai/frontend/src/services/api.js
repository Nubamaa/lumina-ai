import axios from 'axios'

const BASE_URL = 'http://localhost:5000/api'

export const generateLessonPlan = (formData) =>
  axios.post(`${BASE_URL}/generate`, formData)

export const extractLessonPlan = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${BASE_URL}/extract`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getHistory = () =>
  axios.get(`${BASE_URL}/history`)

export const saveToHistory = (plan) =>
  axios.post(`${BASE_URL}/history/save2`, plan)
