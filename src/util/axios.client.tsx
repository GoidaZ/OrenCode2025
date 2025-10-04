import axios, { AxiosError, type CreateAxiosDefaults } from "axios";

const options: CreateAxiosDefaults = {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
}

const axiosClassic = axios.create(options)
const axiosAuth = axios.create(options)

axiosAuth.interceptors.request.use((config) => {
    config.headers = config.headers ?? {}
    const accessToken = localStorage.getItem('token') //TODO: Переписать
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
})

export { axiosClassic, axiosAuth }
