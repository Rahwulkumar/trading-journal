from fastapi.websockets import WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional, Dict
import sqlite3
import os
from fastapi.middleware.cors import CORSMiddleware
import shutil
from fastapi.staticfiles import StaticFiles
from config.trademade import TRADEMADE_API_BASE_URL, TRADEMADE_API_KEY
from datetime import datetime
import requests
import json
import uuid
from google.cloud import storage
from fastapi import UploadFile
import mimetypes
from config.trademade import trademade_service
import asyncio
from typing import List
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials
from googleapiclient.http import MediaIoBaseUpload
import io
import aiohttp


load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket

# Google Drive configuration
DRIVE_CREDENTIALS_PATH = os.getenv("GOOGLE_DRIVE_CREDENTIALS_PATH", "./service-account-key.json")
DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID")  # Optional: specific folder

# Google Drive API scopes
SCOPES = ['https://www.googleapis.com/auth/drive.file']



def get_drive_service():
    """Initialize and return Google Drive service"""
    try:
        credentials = Credentials.from_service_account_file(
            DRIVE_CREDENTIALS_PATH, 
            scopes=SCOPES
        )
        service = build('drive', 'v3', credentials=credentials)
        return service
    except Exception as e:
        print(f"Error initializing Drive service: {e}")
        return None

async def upload_to_drive(file: UploadFile, folder_name: str = "TradeSync Screenshots") -> dict:
    """
    Upload file to Google Drive
    
    Args:
        file: FastAPI UploadFile object
        folder_name: Folder name in Google Drive
        
    Returns:
        dict: Upload result with URL and metadata
    """
    try:
        # Validate file
        if not file.content_type.startswith('image/'):
            raise ValueError("Only image files are allowed")
        
        # Check file size (100MB limit for Drive)
        content = await file.read()
        if len(content) > 100 * 1024 * 1024:  # 100MB
            raise ValueError("File size exceeds 100MB limit")
        
        # Reset file pointer
        await file.seek(0)
        
        # Initialize Drive service
        service = get_drive_service()
        if not service:
            raise Exception("Failed to initialize Google Drive service")
        
        # Create or get folder
        folder_id = get_or_create_folder(service, folder_name)
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_extension = os.path.splitext(file.filename)[1]
        drive_filename = f"TradeSync_{timestamp}_{unique_id}_{file.filename}"
        
        # Prepare file metadata
        file_metadata = {
            'name': drive_filename,
            'parents': [folder_id] if folder_id else [],
            'description': f'TradeSync screenshot uploaded on {datetime.now().isoformat()}'
        }
        
        # Create media upload
        media = MediaIoBaseUpload(
            io.BytesIO(content),
            mimetype=file.content_type,
            resumable=True
        )
        
        # Upload file
        drive_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id,name,webViewLink,webContentLink,size'
        ).execute()
        
        # Make file publicly viewable
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        service.permissions().create(
            fileId=drive_file['id'],
            body=permission
        ).execute()
        
        # Get direct image URL (for displaying in app)
        direct_url = f"https://drive.google.com/uc?id={drive_file['id']}&export=view"
        
        return {
            "success": True,
            "url": direct_url,
            "drive_id": drive_file['id'],
            "web_view_link": drive_file['webViewLink'],
            "original_name": file.filename,
            "drive_name": drive_filename,
            "size": len(content),
            "content_type": file.content_type,
            "uploaded_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Drive upload error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def get_or_create_folder(service, folder_name: str) -> str:
    """
    Get existing folder or create new one in Google Drive
    
    Args:
        service: Google Drive service object
        folder_name: Name of the folder
        
    Returns:
        str: Folder ID
    """
    try:
        # Search for existing folder
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, fields="files(id, name)").execute()
        folders = results.get('files', [])
        
        if folders:
            # Folder exists, return its ID
            return folders[0]['id']
        else:
            # Create new folder
            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = service.files().create(body=folder_metadata, fields='id').execute()
            print(f"Created folder '{folder_name}' with ID: {folder['id']}")
            return folder['id']
            
    except Exception as e:
        print(f"Error with folder operations: {e}")
        return None

# Add WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
        
    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]
                
    async def broadcast_trade_update(self, account: str, trade_data: dict):
        message = json.dumps({
            "type": "trade_update",
            "account": account,
            "data": trade_data,
            "timestamp": datetime.now().isoformat()
        })
        
        if account in self.active_connections:
            for connection in self.active_connections[account]:
                try:
                    await connection.send_text(message)
                except:
                    pass
                    
    async def broadcast_performance_update(self, account: str, performance_data: dict):
        message = json.dumps({
            "type": "performance_update",
            "account": account,
            "data": performance_data,
            "timestamp": datetime.now().isoformat()
        })
        
        if account in self.active_connections:
            for connection in self.active_connections[account]:
                try:
                    await connection.send_text(message)
                except:
                    pass

# Initialize the manager
manager = ConnectionManager()


app = FastAPI()

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "TradeSync API is running successfully! 🚀",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "trades": "/trades/",
            "accounts": "/accounts/",
            "strategies": "/strategies/",
            "reports": "/analytics/summary/",
            "live_prices": "/api/live-price/{symbol}",
            "live_trades_pnl": "/api/live-trades-pnl",
            "upload_screenshot": "/api/upload-screenshot",
            "docs": "/docs",
            "redoc": "/redoc"
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    try:
        # Test database connection
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM trades")
        trade_count = c.fetchone()[0]
        conn.close()
        
        # Test TradeMade API (optional - comment out if no API key yet)
        # trademade_status = "configured" if TRADEMADE_API_KEY and TRADEMADE_API_KEY != "your_api_key_here" else "not_configured"
        
        return {
            "status": "healthy",
            "database": "connected",
            "total_trades": trade_count,
            "server_time": datetime.now().isoformat(),
            # "trademade_api": trademade_status,
            "environment": "development" if os.getenv("DEBUG", "False").lower() == "true" else "production"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "server_time": datetime.now().isoformat()
        }

@app.get("/api/status")
async def api_status():
    """API status for frontend"""
    return {
        "api_running": True,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# Mount the uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = "trading_journal.db"
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # === Trades Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            entry_datetime TEXT,
            exit_datetime TEXT,
            instrument TEXT NOT NULL,
            direction TEXT NOT NULL,
            entry_price REAL NOT NULL,
            exit_price REAL NOT NULL,
            size REAL NOT NULL,
            fees REAL,
            account TEXT NOT NULL,
            stop_loss REAL,
            take_profit REAL,
            trade_type TEXT,
            rationale TEXT,
            tags TEXT,
            pre_emotion TEXT,
            post_reflection TEXT,
            timeframe TEXT,
            risk_amount REAL,
            strategy_tag TEXT,
            rules_followed TEXT
        )
    ''')

    # Patch missing columns in trades
    for column in ["entry_datetime", "exit_datetime", "rules_followed"]:
        try:
            c.execute(f"ALTER TABLE trades ADD COLUMN {column} TEXT")
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e).lower():
                raise e

    # === Accounts Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            account_name TEXT PRIMARY KEY,
            prop_firm TEXT NOT NULL
        )
    ''')

    # Patch missing columns in accounts
    account_columns = {
        "capital_size": "REAL DEFAULT 100000",
        "max_daily_drawdown": "REAL DEFAULT 5",
        "max_overall_drawdown": "REAL DEFAULT 10"
    }

    for column, col_type in account_columns.items():
        try:
            c.execute(f"ALTER TABLE accounts ADD COLUMN {column} {col_type}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" not in str(e).lower():
                raise e

    # === Strategies Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS strategies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            strategy_name TEXT NOT NULL UNIQUE,
            rules TEXT NOT NULL
        )
    ''')

    # === Weekly Bias Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS weekly_bias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            week_start_date TEXT NOT NULL,
            week_end_date TEXT NOT NULL,
            pair TEXT NOT NULL,
            expecting_notes TEXT,
            not_expecting_notes TEXT
        )
    ''')

    # === Bias Points Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS bias_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bias_id INTEGER NOT NULL,
            bias_type TEXT NOT NULL,
            point TEXT NOT NULL,
            FOREIGN KEY (bias_id) REFERENCES weekly_bias(id)
        )
    ''')

    # === Bias Arguments Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS bias_arguments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bias_id INTEGER NOT NULL,
            direction TEXT NOT NULL,
            reason TEXT NOT NULL,
            FOREIGN KEY (bias_id) REFERENCES weekly_bias(id)
        )
    ''')

    # === Screenshots Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS screenshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trade_id INTEGER,
            bias_id INTEGER,
            label TEXT NOT NULL,
            screenshot_url TEXT NOT NULL,
            FOREIGN KEY (trade_id) REFERENCES trades(id),
            FOREIGN KEY (bias_id) REFERENCES weekly_bias(id)
        )
    ''')

    # === Notes Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            content TEXT NOT NULL
        )
    ''')

    # === Trade Chart Data Table ===
    c.execute('''
        CREATE TABLE IF NOT EXISTS trade_chart_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trade_id INTEGER NOT NULL,
            time TEXT NOT NULL,
            open REAL NOT NULL,
            high REAL NOT NULL,
            low REAL NOT NULL,
            close REAL NOT NULL,
            FOREIGN KEY (trade_id) REFERENCES trades(id)
        )
    ''')


    
    

    conn.commit()
    conn.close()


class Screenshot(BaseModel):
    label: str
    screenshot_url: str

class TradeCreate(BaseModel):
    date: str
    entry_datetime: Optional[str] = None
    exit_datetime: Optional[str] = None
    instrument: str
    direction: str
    entry_price: float
    exit_price: float
    size: float
    fees: Optional[float] = 0
    account: str
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    trade_type: Optional[str] = None
    rationale: Optional[str] = None
    tags: Optional[str] = None
    pre_emotion: Optional[str] = None
    post_reflection: Optional[str] = None
    timeframe: Optional[str] = None
    risk_amount: Optional[float] = None
    strategy_tag: Optional[str] = None
    rules_followed: Optional[List[str]] = []
    screenshots: Optional[List[Screenshot]] = []

class AccountCreate(BaseModel):
    account_name: str
    prop_firm: str
    capital_size: Optional[float] = 100000
    max_daily_drawdown: Optional[float] = 5
    max_overall_drawdown: Optional[float] = 10

class NoteCreate(BaseModel):
    date: str
    content: str

class Strategy(BaseModel):
    id: Optional[int] = None
    strategy_name: str
    rules: List[str]

class BiasPoint(BaseModel):
    bias_type: str
    point: str

class BiasArgument(BaseModel):
    direction: str
    reason: str

class WeeklyBiasCreate(BaseModel):
    week_start_date: str
    week_end_date: str
    pair: str
    expecting_notes: Optional[str] = None
    not_expecting_notes: Optional[str] = None
    bias_points: Optional[List[BiasPoint]] = []
    arguments: Optional[List[BiasArgument]] = []
    screenshots: Optional[List[Screenshot]] = []

# Startup event
@app.on_event("startup")
async def startup_event():
    init_db()

@app.post("/trades/", response_model=TradeCreate)
async def create_trade(trade: TradeCreate):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        # Validate required fields
        if not trade.instrument or not trade.direction or not trade.account:
            raise HTTPException(status_code=400, detail="Instrument, direction, and account are required fields")

        # Save the trade entry
        c.execute('''
            INSERT INTO trades (
                date, entry_datetime, exit_datetime, instrument, direction, entry_price, exit_price, size, fees, account,
                stop_loss, take_profit, trade_type, rationale, tags, pre_emotion, post_reflection,
                timeframe, risk_amount, strategy_tag, rules_followed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            trade.date, trade.entry_datetime, trade.exit_datetime, trade.instrument, trade.direction,
            trade.entry_price, trade.exit_price, trade.size, trade.fees, trade.account,
            trade.stop_loss, trade.take_profit, trade.trade_type, trade.rationale, trade.tags,
            trade.pre_emotion, trade.post_reflection, trade.timeframe, trade.risk_amount,
            trade.strategy_tag, ','.join(trade.rules_followed) if trade.rules_followed else None
        ))

        trade_id = c.lastrowid

        # Calculate P&L for broadcasting
        if trade.direction == 'long':
            pnl = (trade.exit_price - trade.entry_price) * trade.size - trade.fees
        else:
            pnl = (trade.entry_price - trade.exit_price) * trade.size - trade.fees
        
        # Broadcast real-time update
        await manager.broadcast_trade_update(trade.account, {
            "trade_id": trade_id,
            "instrument": trade.instrument,
            "direction": trade.direction,
            "pnl": pnl,
            "date": trade.date
        })

        # Save screenshots
        for screenshot in trade.screenshots:
            c.execute('''
                INSERT INTO screenshots (trade_id, label, screenshot_url)
                VALUES (?, ?, ?)
            ''', (trade_id, screenshot.label, screenshot.screenshot_url))

        # Fetch candles using TradeMade API
        def fetch_candles(symbol: str, start: Optional[str], end: Optional[str]):
            if not start or not end:
                print("Skipping candle fetch: entry_datetime or exit_datetime missing")
                return []
            try:
                params = {
                    "symbol": symbol.upper(),
                    "interval": "1h",
                    "start_time": int(datetime.fromisoformat(start).timestamp()),
                    "end_time": int(datetime.fromisoformat(end).timestamp()),
                }
                headers = {
                    "Authorization": f"Bearer {TRADEMADE_API_KEY}"
                }
                response = requests.get(f"{TRADEMADE_API_BASE_URL}/candles", params=params, headers=headers)
                response.raise_for_status()
                return response.json().get("data", [])
            except Exception as e:
                print(f"Error fetching chart data: {e}")
                return []

        candles = fetch_candles(trade.instrument, trade.entry_datetime, trade.exit_datetime)

        # Store chart candles
        for candle in candles:
            c.execute('''
                INSERT INTO trade_chart_data (trade_id, time, open, high, low, close)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                trade_id,
                candle.get("time", ""),
                candle.get("open", 0.0),
                candle.get("high", 0.0),
                candle.get("low", 0.0),
                candle.get("close", 0.0)
            ))

        conn.commit()
        return trade

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create trade: {str(e)}")
    finally:
        conn.close()

@app.get("/trades/")
async def get_trades(account: Optional[str] = None, date: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        query = "SELECT * FROM trades"
        params = []
        conditions = []
        if account:
            conditions.append("account = ?")
            params.append(account)
        if date:
            conditions.append("date = ?")
            params.append(date)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        c.execute(query, params)
        trades = c.fetchall()
        result = []

        for trade in trades:
            trade_id = trade[0]

            # Fetch screenshots
            c.execute("SELECT label, screenshot_url FROM screenshots WHERE trade_id = ?", (trade_id,))
            screenshots = [{"label": row[0], "screenshot_url": row[1]} for row in c.fetchall()]

            # Fetch chart data
            c.execute("SELECT time, open, high, low, close FROM trade_chart_data WHERE trade_id = ? ORDER BY time ASC", (trade_id,))
            chart_data = [
                {
                    "time": row[0],
                    "open": float(row[1]) if row[1] is not None else 0.0,
                    "high": float(row[2]) if row[2] is not None else 0.0,
                    "low": float(row[3]) if row[3] is not None else 0.0,
                    "close": float(row[4]) if row[4] is not None else 0.0,
                }
                for row in c.fetchall()
            ]

            # Correctly map trade data to schema
            trade_dict = {
                "id": trade[0],
                "date": trade[1],
                "entry_datetime": trade[2],
                "exit_datetime": trade[3],
                "instrument": trade[4],
                "direction": trade[5],
                "entry_price": float(trade[6]) if trade[6] is not None else 0.0,
                "exit_price": float(trade[7]) if trade[7] is not None else 0.0,
                "size": float(trade[8]) if trade[8] is not None else 0.0,
                "fees": float(trade[9]) if trade[9] is not None else 0.0,
                "account": trade[10],
                "stop_loss": float(trade[11]) if trade[11] is not None else None,
                "take_profit": float(trade[12]) if trade[12] is not None else None,
                "trade_type": trade[13],
                "rationale": trade[14],
                "tags": trade[15],
                "pre_emotion": trade[16],
                "post_reflection": trade[17],
                "timeframe": trade[18],
                "risk_amount": float(trade[19]) if trade[19] is not None else None,
                "strategy_tag": trade[20],
                "rules_followed": trade[21].split(',') if trade[21] else [],
                "screenshots": screenshots,
                "chart_data": chart_data,
            }

            result.append(trade_dict)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trades: {str(e)}")
    finally:
        conn.close()


@app.get("/analytics/summary/")
async def get_trade_analytics():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    try:
        c.execute("SELECT * FROM trades")
        trades = c.fetchall()

        if not trades:
            return {
                "total_trades": 0,
                "win_rate_percent": 0,
                "average_r_multiple": 0,
                "average_profit": 0,
                "best_trade": None,
                "worst_trade": None,
                "most_traded_pair": None,
                "most_profitable_pair": None
            }

        total = len(trades)
        wins = 0
        total_r = 0
        total_profit = 0
        profit_per_pair = {}
        count_per_pair = {}
        best = None
        worst = None

        for t in trades:
            entry = float(t[6])
            exit = float(t[7])
            fees = float(t[9]) if t[9] else 0
            size = float(t[8])
            risk = float(t[19]) if t[19] else 1  # default risk = 1 if not entered
            pair = t[4]
            pnl = (exit - entry) * size if t[5].lower() == "buy" else (entry - exit) * size
            pnl -= fees
            r_multiple = pnl / risk

            if pnl > 0:
                wins += 1
            total_profit += pnl
            total_r += r_multiple

            if best is None or pnl > best["profit"]:
                best = {"id": t[0], "pair": pair, "profit": pnl}

            if worst is None or pnl < worst["profit"]:
                worst = {"id": t[0], "pair": pair, "profit": pnl}

            profit_per_pair[pair] = profit_per_pair.get(pair, 0) + pnl
            count_per_pair[pair] = count_per_pair.get(pair, 0) + 1

        most_traded = max(count_per_pair.items(), key=lambda x: x[1])[0]
        most_profitable = max(profit_per_pair.items(), key=lambda x: x[1])[0]

        return {
            "total_trades": total,
            "win_rate_percent": round(wins / total * 100, 2),
            "average_r_multiple": round(total_r / total, 2),
            "average_profit": round(total_profit / total, 2),
            "best_trade": best,
            "worst_trade": worst,
            "most_traded_pair": most_traded,
            "most_profitable_pair": most_profitable
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")
    finally:
        conn.close()


@app.put("/trades/{trade_id}")
async def update_trade(trade_id: int, trade: TradeCreate):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Verify trade exists
        c.execute("SELECT 1 FROM trades WHERE id = ?", (trade_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Trade not found")

        c.execute('''
            UPDATE trades SET date = ?, entry_datetime = ?, exit_datetime = ?, instrument = ?, direction = ?,
            entry_price = ?, exit_price = ?, size = ?, fees = ?, account = ?, stop_loss = ?, take_profit = ?,
            trade_type = ?, rationale = ?, tags = ?, pre_emotion = ?, post_reflection = ?, timeframe = ?,
            risk_amount = ?, strategy_tag = ?, rules_followed = ?
            WHERE id = ?
        ''', (
            trade.date, trade.entry_datetime, trade.exit_datetime, trade.instrument, trade.direction,
            trade.entry_price, trade.exit_price, trade.size, trade.fees, trade.account,
            trade.stop_loss, trade.take_profit, trade.trade_type, trade.rationale, trade.tags,
            trade.pre_emotion, trade.post_reflection, trade.timeframe, trade.risk_amount,
            trade.strategy_tag, ','.join(trade.rules_followed) if trade.rules_followed else None,
            trade_id
        ))

        c.execute("DELETE FROM screenshots WHERE trade_id = ?", (trade_id,))
        for screenshot in trade.screenshots:
            c.execute('''
                INSERT INTO screenshots (trade_id, label, screenshot_url)
                VALUES (?, ?, ?)
            ''', (trade_id, screenshot.label, screenshot.screenshot_url))

        conn.commit()
        return trade

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update trade: {str(e)}")
    finally:
        conn.close()

@app.delete("/trades/{trade_id}")
async def delete_trade(trade_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT 1 FROM trades WHERE id = ?", (trade_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Trade not found")

        c.execute("DELETE FROM screenshots WHERE trade_id = ?", (trade_id,))
        c.execute("DELETE FROM trade_chart_data WHERE trade_id = ?", (trade_id,))
        c.execute("DELETE FROM trades WHERE id = ?", (trade_id,))
        conn.commit()
        return {"message": "Trade deleted"}

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete trade: {str(e)}")
    finally:
        conn.close()

# Strategy endpoints
@app.post("/strategies/", response_model=Strategy)
async def create_strategy(strategy: Strategy):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        if not strategy.strategy_name.strip():
            raise HTTPException(status_code=400, detail="Strategy name cannot be empty.")
        if not strategy.rules or any(not rule.strip() for rule in strategy.rules):
            raise HTTPException(status_code=400, detail="All rules must be non-empty.")
        c.execute('INSERT INTO strategies (strategy_name, rules) VALUES (?, ?)',
                  (strategy.strategy_name.strip(), ','.join(rule.strip() for rule in strategy.rules)))
        strategy_id = c.lastrowid
        conn.commit()
        return {"id": strategy_id, "strategy_name": strategy.strategy_name, "rules": strategy.rules}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail=f"Strategy name '{strategy.strategy_name}' already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add strategy: {str(e)}")
    finally:
        conn.close()

@app.get("/strategies/")
async def get_strategies():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT id, strategy_name, rules FROM strategies")
        strategies = c.fetchall()
        return [{"id": s[0], "strategy_name": s[1], "rules": s[2].split(',') if s[2] else []} for s in strategies]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategies: {str(e)}")
    finally:
        conn.close()

@app.put("/strategies/{strategy_id}")
async def update_strategy(strategy_id: int, strategy: Strategy):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        if not strategy.strategy_name.strip():
            raise HTTPException(status_code=400, detail="Strategy name cannot be empty.")
        if not strategy.rules or any(not rule.strip() for rule in strategy.rules):
            raise HTTPException(status_code=400, detail="All rules must be non-empty.")
        c.execute('UPDATE strategies SET strategy_name = ?, rules = ? WHERE id = ?',
                  (strategy.strategy_name.strip(), ','.join(rule.strip() for rule in strategy.rules), strategy_id))
        if c.rowcount == 0:
            raise HTTPException(status_code=404, detail="Strategy not found.")
        conn.commit()
        return {"id": strategy_id, "strategy_name": strategy.strategy_name, "rules": strategy.rules}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail=f"Strategy name '{strategy.strategy_name}' already exists.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update strategy: {str(e)}")
    finally:
        conn.close()

@app.delete("/strategies/{strategy_id}")
async def delete_strategy(strategy_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("DELETE FROM strategies WHERE id = ?", (strategy_id,))
        if c.rowcount == 0:
            raise HTTPException(status_code=404, detail="Strategy not found.")
        conn.commit()
        return {"message": "Strategy deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete strategy: {str(e)}")
    finally:
        conn.close()

# Account endpoints
@app.get("/accounts/")
async def get_accounts():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT account_name, prop_firm, capital_size, max_daily_drawdown, max_overall_drawdown FROM accounts")
        accounts = c.fetchall()
        return [{
            "account_name": a[0],
            "prop_firm": a[1],
            "capital_size": float(a[2]) if a[2] is not None else 100000,
            "max_daily_drawdown": float(a[3]) if a[3] is not None else 5,
            "max_overall_drawdown": float(a[4]) if a[4] is not None else 10
        } for a in accounts]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch accounts: {str(e)}")
    finally:
        conn.close()

@app.post("/accounts/")
async def create_account(account: AccountCreate):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute('INSERT INTO accounts (account_name, prop_firm, capital_size, max_daily_drawdown, max_overall_drawdown) VALUES (?, ?, ?, ?, ?)',
                  (account.account_name, account.prop_firm, account.capital_size, account.max_daily_drawdown, account.max_overall_drawdown))
        conn.commit()
        return account
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Account name already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create account: {str(e)}")
    finally:
        conn.close()

@app.delete("/accounts/{account_name}")
async def delete_account(account_name: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT 1 FROM accounts WHERE account_name = ?", (account_name,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Account not found")
        c.execute("SELECT 1 FROM trades WHERE account = ?", (account_name,))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="Cannot delete account with associated trades")
        c.execute("DELETE FROM accounts WHERE account_name = ?", (account_name,))
        conn.commit()
        return {"message": "Account deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")
    finally:
        conn.close()

# Notes endpoints
@app.post("/notes/", response_model=NoteCreate)
async def create_note(note: NoteCreate):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute('INSERT INTO notes (date, content) VALUES (?, ?)',
                  (note.date, note.content))
        conn.commit()
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create note: {str(e)}")
    finally:
        conn.close()

@app.get("/notes/")
async def get_notes(date: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        query = "SELECT id, date, content FROM notes"
        params = []
        if date:
            query += " WHERE date = ?"
            params.append(date)
        c.execute(query, params)
        notes = c.fetchall()
        return [{"id": n[0], "date": n[1], "content": n[2]} for n in notes]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notes: {str(e)}")
    finally:
        conn.close()

@app.delete("/notes/{note_id}")
async def delete_note(note_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT 1 FROM notes WHERE id = ?", (note_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Note not found")
        c.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        conn.commit()
        return {"message": "Note deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete note: {str(e)}")
    finally:
        conn.close()

# Weekly Bias endpoints
@app.post("/weekly-bias/", response_model=WeeklyBiasCreate)
async def create_weekly_bias(bias: WeeklyBiasCreate):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute('''
            INSERT INTO weekly_bias (week_start_date, week_end_date, pair, expecting_notes, not_expecting_notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            bias.week_start_date, bias.week_end_date, bias.pair,
            bias.expecting_notes, bias.not_expecting_notes
        ))
        bias_id = c.lastrowid
        for point in bias.bias_points:
            c.execute('''
                INSERT INTO bias_points (bias_id, bias_type, point)
                VALUES (?, ?, ?)
            ''', (bias_id, point.bias_type, point.point))
        for argument in bias.arguments:
            c.execute('''
                INSERT INTO bias_arguments (bias_id, direction, reason)
                VALUES (?, ?, ?)
            ''', (bias_id, argument.direction, argument.reason))
        for screenshot in bias.screenshots:
            c.execute('''
                INSERT INTO screenshots (bias_id, label, screenshot_url)
                VALUES (?, ?, ?)
            ''', (bias_id, screenshot.label, screenshot.screenshot_url))
        conn.commit()
        return bias
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create weekly bias: {str(e)}")
    finally:
        conn.close()

@app.get("/weekly-bias/")
async def get_weekly_biases():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT id, week_start_date, week_end_date, pair, expecting_notes, not_expecting_notes FROM weekly_bias")
        biases = c.fetchall()
        result = []
        for bias in biases:
            c.execute("SELECT bias_type, point FROM bias_points WHERE bias_id = ?", (bias[0],))
            points = [{"bias_type": row[0], "point": row[1]} for row in c.fetchall()]
            c.execute("SELECT direction, reason FROM bias_arguments WHERE bias_id = ?", (bias[0],))
            arguments = [{"direction": row[0], "reason": row[1]} for row in c.fetchall()]
            c.execute("SELECT label, screenshot_url FROM screenshots WHERE bias_id = ?", (bias[0],))
            screenshots = [{"label": row[0], "screenshot_url": row[1]} for row in c.fetchall()]
            result.append({
                "id": bias[0], "week_start_date": bias[1], "week_end_date": bias[2], "pair": bias[3],
                "expecting_notes": bias[4], "not_expecting_notes": bias[5], "bias_points": points,
                "arguments": arguments, "screenshots": screenshots
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weekly biases: {str(e)}")
    finally:
        conn.close()

@app.get("/weekly-bias/{bias_id}/")
async def get_weekly_bias(bias_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT id, week_start_date, week_end_date, pair, expecting_notes, not_expecting_notes FROM weekly_bias WHERE id = ?", (bias_id,))
        bias = c.fetchone()
        if not bias:
            raise HTTPException(status_code=404, detail="Bias not found")
        c.execute("SELECT bias_type, point FROM bias_points WHERE bias_id = ?", (bias_id,))
        points = [{"bias_type": row[0], "point": row[1]} for row in c.fetchall()]
        c.execute("SELECT direction, reason FROM bias_arguments WHERE bias_id = ?", (bias_id,))
        arguments = [{"direction": row[0], "reason": row[1]} for row in c.fetchall()]
        c.execute("SELECT label, screenshot_url FROM screenshots WHERE bias_id = ?", (bias_id,))
        screenshots = [{"label": row[0], "screenshot_url": row[1]} for row in c.fetchall()]
        return {
            "id": bias[0], "week_start_date": bias[1], "week_end_date": bias[2], "pair": bias[3],
            "expecting_notes": bias[4], "not_expecting_notes": bias[5], "bias_points": points,
            "arguments": arguments, "screenshots": screenshots
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch weekly bias: {str(e)}")
    finally:
        conn.close()

@app.delete("/weekly-bias/{bias_id}")
async def delete_weekly_bias(bias_id: int):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("SELECT 1 FROM weekly_bias WHERE id = ?", (bias_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Weekly bias not found")
        c.execute("DELETE FROM bias_points WHERE bias_id = ?", (bias_id,))
        c.execute("DELETE FROM bias_arguments WHERE bias_id = ?", (bias_id,))
        c.execute("DELETE FROM screenshots WHERE bias_id = ?", (bias_id,))
        c.execute("DELETE FROM weekly_bias WHERE id = ?", (bias_id,))
        conn.commit()
        return {"message": "Weekly bias deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete weekly bias: {str(e)}")
    finally:
        conn.close()

# Screenshot upload endpoint
@app.post("/upload-screenshot/")
async def upload_screenshot(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/uploads/{file.filename}"  # Relative URL for better portability
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload screenshot: {str(e)}")
    

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            # For now, just keep the connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)


@app.post("/api/upload-screenshot")
async def upload_screenshot_endpoint(
    file: UploadFile = File(...),
    folder: str = "TradeSync Screenshots"
):
    """
    Upload screenshot to Google Drive
    """
    try:
        # Validate file
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Upload to Google Drive
        result = await upload_to_drive(file, folder)
        
        if result["success"]:
            return {
                "url": result["url"],
                "driveId": result["drive_id"],
                "webViewLink": result["web_view_link"],
                "fileName": result["drive_name"],
                "originalName": result["original_name"],
                "size": result["size"],
                "uploadedAt": result["uploaded_at"],
                "message": "Screenshot uploaded successfully to Google Drive"
            }
        else:
            raise HTTPException(status_code=500, detail=result["error"])
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Test endpoint for Google Drive
@app.get("/api/test-drive")
async def test_drive_connection():
    """Test Google Drive connection"""
    try:
        service = get_drive_service()
        if service:
            # Test by listing some files
            results = service.files().list(pageSize=1, fields="files(id, name)").execute()
            return {
                "status": "success",
                "message": "Successfully connected to Google Drive",
                "test_result": f"Found {len(results.get('files', []))} files in drive"
            }
        else:
            return {
                "status": "error",
                "message": "Failed to initialize Google Drive service"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Connection failed: {str(e)}"
        }
    

@app.get("/api/live-price/{symbol}")
async def get_live_price(symbol: str):
    """Get live price for a single currency pair"""
    try:
        result = await trademade_service.get_live_price(symbol)
        if result.get("success"):
            return {
                "success": True,
                "data": {
                    "symbol": result["symbol"],
                    "bid": result["bid"],
                    "ask": result["ask"],
                    "mid": result["mid"],
                    "timestamp": result["timestamp"]
                }
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to fetch price"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/live-prices")
async def get_live_prices(request: dict):
    """Get live prices for multiple currency pairs"""
    try:
        symbols = request.get("symbols", [])
        if not symbols:
            raise HTTPException(status_code=400, detail="No symbols provided")
        
        results = await trademade_service.get_live_prices(symbols)
        
        # Filter successful results
        successful_results = [r for r in results if r.get("success")]
        failed_results = [r for r in results if not r.get("success")]
        
        return {
            "success": True,
            "data": successful_results,
            "errors": failed_results if failed_results else None,
            "total_requested": len(symbols),
            "total_successful": len(successful_results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/live-trades-pnl")
async def get_live_trades_pnl():
    """Calculate live P&L for all active trades"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Get all live trades that are not closed
        c.execute("""
            SELECT id, instrument, direction, entry_price, size, fees, entry_datetime
            FROM trades 
            WHERE (trade_type = 'live' OR entry_datetime IS NOT NULL) 
            AND exit_datetime IS NULL
        """)
        
        live_trades = c.fetchall()
        
        if not live_trades:
            return {
                "success": True,
                "data": [],
                "message": "No active live trades found"
            }
        
        # Get unique symbols for price fetching
        symbols = list(set([trade[1] for trade in live_trades]))  # trade[1] is instrument
        
        # Fetch live prices for all symbols
        prices_result = await trademade_service.get_live_prices(symbols)
        
        # Create price lookup dictionary
        price_lookup = {}
        for price_data in prices_result:
            if price_data.get("success"):
                price_lookup[price_data["symbol"]] = price_data["mid"]
        
        # Calculate P&L for each trade
        trades_with_pnl = []
        for trade in live_trades:
            trade_id, instrument, direction, entry_price, size, fees, entry_datetime = trade
            
            current_price = price_lookup.get(instrument)
            if current_price:
                trade_dict = {
                    "entry_price": entry_price,
                    "size": size,
                    "fees": fees or 0,
                    "direction": direction
                }
                
                live_pnl = trademade_service.calculate_live_pnl(trade_dict, current_price)
                
                trades_with_pnl.append({
                    "trade_id": trade_id,
                    "instrument": instrument,
                    "direction": direction,
                    "entry_price": entry_price,
                    "current_price": current_price,
                    "size": size,
                    "live_pnl": live_pnl,
                    "entry_datetime": entry_datetime,
                    "duration_minutes": (
                        (datetime.now() - datetime.fromisoformat(entry_datetime)).total_seconds() / 60
                        if entry_datetime else 0
                    )
                })
            else:
                # If price not available, add trade with error
                trades_with_pnl.append({
                    "trade_id": trade_id,
                    "instrument": instrument,
                    "direction": direction,
                    "entry_price": entry_price,
                    "current_price": None,
                    "size": size,
                    "live_pnl": 0,
                    "error": f"Price not available for {instrument}",
                    "entry_datetime": entry_datetime
                })
        
        return {
            "success": True,
            "data": trades_with_pnl,
            "total_live_trades": len(trades_with_pnl),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating live P&L: {str(e)}")
    finally:
        conn.close()

@app.get("/api/historical-data/{symbol}")
async def get_historical_data(
    symbol: str,
    timeframe: str = "1H",
    start_date: str = None,
    end_date: str = None
):
    """Get historical candlestick data for chart analysis"""
    try:
        result = await trademade_service.get_historical_candles(
            symbol=symbol,
            timeframe=timeframe,
            start_time=start_date,
            end_time=end_date
        )
        
        if result.get("success"):
            return {
                "success": True,
                "data": {
                    "symbol": result["symbol"],
                    "candles": result["candles"],
                    "timeframe": timeframe,
                    "total_candles": len(result["candles"])
                }
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to fetch historical data"))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/close-live-trade/{trade_id}")
async def close_live_trade(trade_id: int, request: dict):
    """Close a live trade with current market price"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        # Get the trade details
        c.execute("SELECT instrument, direction, entry_price, size, fees FROM trades WHERE id = ?", (trade_id,))
        trade_data = c.fetchone()
        
        if not trade_data:
            raise HTTPException(status_code=404, detail="Trade not found")
        
        instrument, direction, entry_price, size, fees = trade_data
        
        # Get exit price from request or fetch current market price
        exit_price = request.get("exit_price")
        if not exit_price:
            price_result = await trademade_service.get_live_price(instrument)
            if price_result.get("success"):
                exit_price = price_result["mid"]
            else:
                raise HTTPException(status_code=400, detail="Could not fetch current market price")
        
        # Calculate final P&L
        trade_dict = {
            "entry_price": entry_price,
            "size": size,
            "fees": fees or 0,
            "direction": direction
        }
        final_pnl = trademade_service.calculate_live_pnl(trade_dict, float(exit_price))
        
        # Update the trade in database
        c.execute("""
            UPDATE trades 
            SET exit_price = ?, exit_datetime = ?, trade_type = 'closed_live'
            WHERE id = ?
        """, (exit_price, datetime.now().isoformat(), trade_id))
        
        # Calculate R-multiple if risk amount exists
        c.execute("SELECT risk_amount FROM trades WHERE id = ?", (trade_id,))
        risk_amount = c.fetchone()[0]
        r_multiple = final_pnl / risk_amount if risk_amount and risk_amount > 0 else 0
        
        conn.commit()
        
        # Broadcast the trade closure via WebSocket
        await manager.broadcast_trade_update(f"trade_{trade_id}", {
            "type": "trade_closed",
            "trade_id": trade_id,
            "final_pnl": final_pnl,
            "exit_price": exit_price,
            "r_multiple": r_multiple
        })
        
        return {
            "success": True,
            "message": "Trade closed successfully",
            "data": {
                "trade_id": trade_id,
                "exit_price": exit_price,
                "final_pnl": final_pnl,
                "r_multiple": round(r_multiple, 2),
                "closed_at": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error closing trade: {str(e)}")
    finally:
        conn.close()

# Enhanced WebSocket endpoint for live price streaming
@app.websocket("/ws/live-prices/{client_id}")
async def websocket_live_prices(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for streaming live prices"""
    await websocket.accept()
    
    try:
        while True:
            # Wait for client to send symbols they want to track
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "subscribe":
                symbols = message.get("symbols", [])
                
                # Fetch live prices for requested symbols
                while True:
                    try:
                        prices = await trademade_service.get_live_prices(symbols)
                        successful_prices = [p for p in prices if p.get("success")]
                        
                        await websocket.send_text(json.dumps({
                            "type": "price_update",
                            "data": successful_prices,
                            "timestamp": datetime.now().isoformat()
                        }))
                        
                        # Wait 1 second before next update
                        await asyncio.sleep(1)
                        
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            "type": "error",
                            "message": str(e)
                        }))
                        break
                        
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

# Add cleanup when app shuts down
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources when app shuts down"""
    await trademade_service.close_session()


# Add this to the bottom of your main.py file (replace any existing if __name__ == "__main__" block)

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting TradeSync API Server...")
    print("📊 Dashboard will be available at: http://localhost:8000")
    print("📖 API Documentation at: http://localhost:8000/docs")
    print("🔄 Interactive API at: http://localhost:8000/redoc")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",  # module:app
        host="0.0.0.0",  # Allow external connections
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )


@app.get("/api/test-trademade")
async def test_trademade_connection():
    """Test TradeMade API connection with detailed debugging"""
    try:
        api_key = os.getenv("TRADEMADE_API_KEY")
        
        if not api_key:
            return {
                "status": "error",
                "message": "TRADEMADE_API_KEY not found in environment"
            }
        
        # Test direct API call with detailed response
        async with aiohttp.ClientSession() as session:
            url = "https://marketdata.tradermade.com/api/v1/live"
            params = {
                "currency": "EURUSD",
                "api_key": api_key
            }
            
            async with session.get(url, params=params) as response:
                response_text = await response.text()
                
                return {
                    "status": "debug",
                    "api_url": f"{url}?currency=EURUSD&api_key=***",
                    "status_code": response.status,
                    "response_headers": dict(response.headers),
                    "response_text": response_text,
                    "response_length": len(response_text)
                }
                
    except Exception as e:
        return {
            "status": "error",
            "message": f"Debug test failed: {str(e)}"
        }