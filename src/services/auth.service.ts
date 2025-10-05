'use client'
import { ICallbackResponse, IMe } from "@/interfaces/Auth.interface"
import { axiosAuth, axiosClassic } from "@/util/axios.client"

class AuthService {
    private BASE_URL = '/auth/'
    
    async callback(code: string, redirect_uri: string): Promise<ICallbackResponse> {
        return (await axiosClassic.get(`${this.BASE_URL}callback`, {params: {code, redirect_uri}})).data
    }

    async me(): Promise<IMe> {
        return (await axiosAuth.get(`${this.BASE_URL}me`)).data
    }
}

export default new AuthService()
