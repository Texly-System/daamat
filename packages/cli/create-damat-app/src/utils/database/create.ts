import { EOL } from "os";
import type pg from "@damatjs/deps/pg";
import postgresClient, {
  DEFAULT_HOST,
  DEFAULT_PORT,
} from "./postgresClient";
import * as p from "@clack/prompts";
import logMessage from "../logger/message";
import formatConnectionString from "./formatConnectionString";
import type { Spinner } from "yocto-spinner";
import terminalLink from "terminal-link";

type CreateDbOptions = {
  client: pg.Client;
  db: string;
};

export default async function createDb({ client, db }: CreateDbOptions) {
  await client.query(`CREATE DATABASE "${db}"`);
}

async function doesDbExist(
  client: pg.Client,
  dbName: string,
): Promise<boolean> {
  const result = await client.query(
    'SELECT datname FROM pg_catalog.pg_database WHERE datname = $1',
    [dbName]
  );

  return !!result.rowCount;
}

export async function runCreateDb({
  client,
  dbName,
  spinner,
}: {
  client: pg.Client;
  dbName: string;
  spinner: Spinner;
}): Promise<pg.Client> {
  let newClient = client;

  if (!client.user || !client.password) {
    spinner.stop();
    logMessage({
      message: `An error occurred while trying to create your database: ${client.user}`,
      type: "error",
    });
  }

  try {
    // create postgres database
    await createDb({
      client,
      db: dbName,
    });

    // create a new connection with database selected
    await client.end();

    newClient = await postgresClient({
      user: client.user!,
      password: client.password!,
      database: dbName,
    });
  } catch (e) {
    spinner.stop();
    logMessage({
      message: `An error occurred while trying to create your database: ${e}`,
      type: "error",
    });
  }

  return newClient;
}

async function getForDbName({
  dbName,
  verbose = false,
}: {
  dbName: string;
  verbose?: boolean;
}): Promise<{
  client: pg.Client;
  dbConnectionString: string;
  dbName: string;
}> {
  let client!: pg.Client;
  let postgresUsername = "postgres";
  let postgresPassword = "";

  const defaultConnectionOptions = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
  };

  try {
    client = await postgresClient({
      user: postgresUsername,
      password: postgresPassword,
      ...defaultConnectionOptions,
    });
  } catch (e) {
    if (verbose) {
      logMessage({
        message: `The following error occured when connecting to the database: ${e}`,
        type: "verbose",
      });
    }
    // ask for the user's postgres credentials
    const username = await p.text({
      message: "Enter your Postgres username",
      placeholder: "postgres",
      defaultValue: "postgres",
      validate: (value: string) => {
        if (!value || value.length === 0) return "Username is required";
      },
    });

    if (p.isCancel(username)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    const password = await p.password({
      message: "Enter your Postgres password",
    });

    if (p.isCancel(password)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    postgresUsername = username;
    postgresPassword = password || "";

    const userDbName = await p.text({
      message: "Enter your Postgres user's database name",
      placeholder: postgresUsername,
      defaultValue: postgresUsername,
      validate: (value: string) => {
        if (!value || value.length === 0) return "Database name is required";
      },
    });

    if (p.isCancel(userDbName)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    try {
      //TODO: not sure why the port and host are not asked by used the default values need to check
      client = await postgresClient({
        user: postgresUsername,
        password: postgresPassword,
        database: userDbName,
        ...defaultConnectionOptions,
      });
    } catch (e) {
      logMessage({
        message: `Couldn't connect to PostgreSQL because of the following error: ${e}.${EOL}${EOL}Make sure you have PostgreSQL installed and the credentials you provided are correct.${EOL}${EOL}If you keep running into this issue despite having PostgreSQL installed, please check out our ${terminalLink(
          "troubleshooting guides",
          "https://docs.damat.com/resources/troubleshooting/database-errors",
        )}.`,
        type: "error",
      });
    }
  }

  // check if database exists
  if (await doesDbExist(client, dbName)) {
    const newDbName = await p.text({
      message: `A database already exists with the name ${dbName}, please enter a name for the database:`,
      placeholder: dbName,
      validate: (value: string) => {
        if (!value || value.length === 0) return "Database name is required";
        if (value === dbName) return "Please enter a different name";
      },
    });

    if (p.isCancel(newDbName)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    dbName = newDbName;
  }

  // format connection string
  const dbConnectionString = formatConnectionString({
    user: postgresUsername,
    password: postgresPassword,
    host: client!.host,
    db: dbName,
  });

  return {
    client,
    dbConnectionString,
    dbName,
  };
}

async function getForDbUrl({
  dbUrl,
  verbose = false,
}: {
  dbUrl: string;
  verbose?: boolean;
}): Promise<{
  client: pg.Client;
  dbConnectionString: string;
}> {
  let client!: pg.Client;

  try {
    client = await postgresClient({
      connectionString: dbUrl,
    });
  } catch (e) {
    if (verbose) {
      logMessage({
        message: `The following error occured when connecting to the database: ${e}`,
        type: "verbose",
      });
    }
    logMessage({
      message: `Couldn't connect to PostgreSQL using the database URL you passed. Make sure it's correct and try again.`,
      type: "error",
    });
  }

  return {
    client,
    dbConnectionString: dbUrl,
  };
}

export async function getDbClientAndCredentials({
  dbName = "",
  dbUrl = "",
  verbose = false,
}): Promise<{
  client: pg.Client;
  dbConnectionString: string;
  verbose?: boolean;
  dbName?: string;
}> {
  // Check the db-url first, because the dbName is always defined in damatProjectCreator->create()->initializeProject()->setupDatabase()
  if (dbUrl) {
    return await getForDbUrl({
      dbUrl,
      verbose,
    });
  } else {
    return await getForDbName({
      dbName,
      verbose,
    });
  }
}
