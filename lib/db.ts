import { createClient, type Client } from "@libsql/client";
import type { ContentType } from "@/lib/content";

export type CategoryCount = {
  category: string;
  count: number;
};

function createDbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("Missing TURSO_DATABASE_URL environment variable.");
  }

  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
}

let db: Client | null = null;
let initPromise: Promise<void> | null = null;

type TableColumn = {
  name: string;
  notnull: number;
};

function getDbClient(): Client {
  if (!db) {
    db = createDbClient();
  }

  return db;
}

async function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const client = getDbClient();
      await client.execute(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content_type TEXT NOT NULL,
          content_value TEXT NOT NULL,
          category TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const columns = await getReportsTableColumns(client);
      const hasLegacyPhoneColumn = columns.has("phone_number");
      const missingRequiredColumns =
        !columns.has("content_type") || !columns.has("content_value") || !columns.has("category");

      if (hasLegacyPhoneColumn || missingRequiredColumns) {
        await rebuildReportsTable(client, columns);
      }

      await ensureReportIndexes(client);
    })();
  }

  await initPromise;
}

export async function addReports(
  contentType: ContentType,
  contentValue: string,
  categories: string[]
): Promise<void> {
  await initDb();
  const client = getDbClient();

  for (const category of categories) {
    await client.execute({
      sql: `
        INSERT INTO reports (content_type, content_value, category)
        VALUES (?, ?, ?)
      `,
      args: [contentType, contentValue, category]
    });
  }
}

export async function getReportStats(
  contentType: ContentType,
  contentValue: string
): Promise<{ totalReports: number; categories: CategoryCount[] }> {
  await initDb();
  const client = getDbClient();
  const rows = await client.execute({
    sql: `
      SELECT category, COUNT(*) AS count
      FROM reports
      WHERE content_type = ?
        AND content_value = ?
      GROUP BY category
      ORDER BY count DESC
    `,
    args: [contentType, contentValue]
  });

  const normalizedRows = rows.rows
    .map((row) => ({
      category: String(row.category ?? ""),
      count: Number(row.count ?? 0)
    }))
    .filter((row) => row.category !== "");

  const totalReports = normalizedRows.reduce((acc, row) => acc + row.count, 0);

  return { totalReports, categories: normalizedRows };
}

async function getReportsTableColumns(client: Client): Promise<Map<string, TableColumn>> {
  const result = await client.execute("PRAGMA table_info(reports)");
  const columnMap = new Map<string, TableColumn>();

  for (const row of result.rows) {
    const name = String(row.name ?? "");
    if (!name) {
      continue;
    }

    columnMap.set(name, {
      name,
      notnull: Number(row.notnull ?? 0)
    });
  }

  return columnMap;
}

async function ensureReportIndexes(client: Client): Promise<void> {
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_reports_content
    ON reports(content_type, content_value)
  `);
}

async function rebuildReportsTable(client: Client, columns: Map<string, TableColumn>): Promise<void> {
  const hasContentType = columns.has("content_type");
  const hasContentValue = columns.has("content_value");
  const hasPhoneNumber = columns.has("phone_number");
  const hasCreatedAt = columns.has("created_at");

  const contentTypeExpr = hasContentType
    ? "CASE WHEN content_type IS NULL OR TRIM(content_type) = '' THEN 'phone' ELSE content_type END"
    : "'phone'";

  const fallbackValueExpr = hasPhoneNumber ? "COALESCE(phone_number, '')" : "''";
  const contentValueExpr = hasContentValue
    ? `CASE WHEN content_value IS NULL OR TRIM(content_value) = '' THEN ${fallbackValueExpr} ELSE content_value END`
    : fallbackValueExpr;
  const createdAtExpr = hasCreatedAt ? "COALESCE(created_at, CURRENT_TIMESTAMP)" : "CURRENT_TIMESTAMP";

  const contentFilters: string[] = [];
  if (hasContentValue) {
    contentFilters.push("(content_value IS NOT NULL AND TRIM(content_value) <> '')");
  }
  if (hasPhoneNumber) {
    contentFilters.push("(phone_number IS NOT NULL AND TRIM(phone_number) <> '')");
  }
  const contentFilter = contentFilters.length > 0 ? contentFilters.join(" OR ") : "1 = 0";

  await client.execute("BEGIN");
  try {
    await client.execute(`
      CREATE TABLE reports_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type TEXT NOT NULL,
        content_value TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      INSERT INTO reports_v2 (id, content_type, content_value, category, created_at)
      SELECT
        id,
        ${contentTypeExpr},
        ${contentValueExpr},
        category,
        ${createdAtExpr}
      FROM reports
      WHERE category IS NOT NULL
        AND TRIM(category) <> ''
        AND (${contentFilter})
    `);

    await client.execute("DROP TABLE reports");
    await client.execute("ALTER TABLE reports_v2 RENAME TO reports");
    await client.execute("COMMIT");
  } catch (error) {
    await client.execute("ROLLBACK");
    throw error;
  }
}
