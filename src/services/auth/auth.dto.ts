/** The authenticated user shape, shared by the auth provider and the data layer. */
export interface AuthUser {
  id: string
  email: string
  name: string
}
