import sqlite3
from datetime import datetime

def upgrade_database():
    conn = sqlite3.connect('trading_journal.db')
    c = conn.cursor()
    
    # Enable WAL mode for better concurrent access
    c.execute("PRAGMA journal_mode=WAL")
    
    # Add indices for faster queries
    indices = [
        "CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date)",
        "CREATE INDEX IF NOT EXISTS idx_trades_account ON trades(account)",
        "CREATE INDEX IF NOT EXISTS idx_trades_instrument ON trades(instrument)",
        "CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_tag)",
        "CREATE INDEX IF NOT EXISTS idx_trades_date_account ON trades(date, account)",
        "CREATE INDEX IF NOT EXISTS idx_screenshots_trade_id ON screenshots(trade_id)",
        "CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date)",
    ]
    
    for index in indices:
        c.execute(index)
    
    # Add computed columns for performance metrics
    try:
        c.execute("""
            ALTER TABLE trades ADD COLUMN net_pnl REAL GENERATED ALWAYS AS 
            (CASE 
                WHEN direction = 'long' THEN (exit_price - entry_price) * size - fees
                ELSE (entry_price - exit_price) * size - fees
            END) STORED
        """)
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Create a performance summary table for fast analytics
    c.execute("""
        CREATE TABLE IF NOT EXISTS performance_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account TEXT NOT NULL,
            date TEXT NOT NULL,
            total_trades INTEGER DEFAULT 0,
            winning_trades INTEGER DEFAULT 0,
            losing_trades INTEGER DEFAULT 0,
            gross_pnl REAL DEFAULT 0,
            net_pnl REAL DEFAULT 0,
            largest_win REAL DEFAULT 0,
            largest_loss REAL DEFAULT 0,
            win_rate REAL DEFAULT 0,
            profit_factor REAL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(account, date)
        )
    """)
    
    # Create triggers to update performance cache
    c.execute("""
        CREATE TRIGGER IF NOT EXISTS update_performance_cache
        AFTER INSERT ON trades
        BEGIN
            INSERT OR REPLACE INTO performance_cache (
                account, date, total_trades, winning_trades, losing_trades,
                gross_pnl, net_pnl, largest_win, largest_loss, win_rate, profit_factor
            )
            SELECT 
                NEW.account,
                NEW.date,
                COUNT(*) as total_trades,
                SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
                SUM(CASE WHEN net_pnl <= 0 THEN 1 ELSE 0 END) as losing_trades,
                SUM(net_pnl + fees) as gross_pnl,
                SUM(net_pnl) as net_pnl,
                MAX(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) as largest_win,
                MIN(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END) as largest_loss,
                CAST(SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as win_rate,
                CASE 
                    WHEN SUM(CASE WHEN net_pnl < 0 THEN ABS(net_pnl) ELSE 0 END) > 0
                    THEN SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) / 
                         SUM(CASE WHEN net_pnl < 0 THEN ABS(net_pnl) ELSE 0 END)
                    ELSE 999.99
                END as profit_factor
            FROM trades
            WHERE account = NEW.account AND date = NEW.date;
        END;
    """)
    
    conn.commit()
    conn.close()
    print("Database upgraded successfully!")

# Run this once
if __name__ == "__main__":
    upgrade_database()