export type AuthUser = {
  id: string
  username: string
  email: string
  createdAt: string
}

export type AuthResponse = {
  user: AuthUser
  token: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type SignupPayload = {
  username: string
  email: string
  password: string
}
