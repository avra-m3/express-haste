import { Handler } from "express"

declare module 'express' {

    export interface Route {
        path?: string
        stack: Layer[]
        methods: Record<string, boolean>
    }
    export interface Layer {
        name?: string,
        path?: string,
        params?: string,
        method?: string
        route: Route
        keys: string[]
        regexp?: RegExp
        handle: Handler
    }

    export interface Router {
        stack: Layer[]
    }
}
