export interface User {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  
  export interface AuthResponse {
    user: User
    token: string
    message: string
  }
  
  export interface LoginData {
    username: string
    password: string
  }
  
  export interface RegisterData {
    username: string
    email: string
    first_name: string
    last_name: string
    password: string
    password_confirm: string
  }