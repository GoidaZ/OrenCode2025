'use client'
import { ICallbackResponse, IMe } from "@/interfaces/Auth.interface"
import { axiosAuth, axiosClassic } from "@/util/axios.client"

class AuthService {
    private BASE_URL = '/auth/'
    
    async callback(code: string): Promise<ICallbackResponse> {
        return (await axiosClassic.get(`${this.BASE_URL}callback`, {params: {code}})).data
    }

    async me(): Promise<IMe> {
        return (await axiosAuth.get(`${this.BASE_URL}me`)).data
    }
}

export default new AuthService()
