from databases import Database

# Database connection
DATABASE_URL = "sqlite:///trades.db"
database = Database(DATABASE_URL)

async def init_db():
    # Create trades table
    query = """
    CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        instrument TEXT,
        direction TEXT,
        size REAL,
        entry_price REAL,
        exit_price REAL,
        trade_type TEXT,
        fees REAL,
        stop_loss REAL,
        take_profit REAL,
        rationale TEXT,
        tags TEXT,
        screenshot_path TEXT,
        pre_emotion TEXT,
        post_reflection TEXT
    )
    """
    await database.execute(query)