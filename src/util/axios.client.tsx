import axios, { AxiosError, type CreateAxiosDefaults } from "axios";

const options: CreateAxiosDefaults = {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
}

const axiosClassic = axios.create(options)

export { axiosClassic }
