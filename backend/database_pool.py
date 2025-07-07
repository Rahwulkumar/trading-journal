import sqlite3
from contextlib import contextmanager
from queue import Queue
import threading

class DatabasePool:
    def __init__(self, database_path, pool_size=10):
        self.database_path = database_path
        self.pool = Queue(maxsize=pool_size)
        self.lock = threading.Lock()
        
        # Initialize connection pool
        for _ in range(pool_size):
            conn = sqlite3.connect(database_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            self.pool.put(conn)
    
    @contextmanager
    def get_connection(self):
        conn = self.pool.get()
        try:
            yield conn
        finally:
            self.pool.put(conn)

# Initialize pool
db_pool = DatabasePool("trading_journal.db")