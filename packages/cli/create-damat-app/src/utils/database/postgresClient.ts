import pg from "@damatjs/deps/pg"

const { Client } = pg as any

export const DEFAULT_HOST = "localhost"
export const DEFAULT_PORT = 5432

export type PostgresConnection = {
  user?: string
  password?: string
  connectionString?: string
  database?: string
  host?: string
  port?: number
}

export default async (connect: PostgresConnection) => {
  const client = new Client(connect)

  await client.connect()

  return client
}
