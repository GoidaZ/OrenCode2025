'use client'
import IRequest from "@/interfaces/Request.interface"
import { axiosClassic } from "@/util/axios.client"

class RequestService {
    private BASE_URL = '/request/'
    
    async list(): Promise<IRequest[]> {
        return (await axiosClassic.get(`${this.BASE_URL}list`)).data
    }
}

export default new RequestService()
