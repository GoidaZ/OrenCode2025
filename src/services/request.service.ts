'use client'
import IRequest from "@/interfaces/Request.interface"
import { axiosAuth } from "@/util/axios.client"

class RequestService {
    private BASE_URL = '/request/manage/'
    
    async list(): Promise<IRequest[]> {
        return (await axiosAuth.get(`${this.BASE_URL}list`)).data
    }

    async approve(id: number, data: Record<string, string>): Promise<void> {
        return (await axiosAuth.post(`${this.BASE_URL}${id}/approve`, {data: data})).data
    }
}

export default new RequestService()
