import sqlite3
import os
from typing import Optional, List, Dict, Any

def get_db():
    # Create database directory if it doesn't exist
    db_path = 'db.sqlite'
    
    # Create the database and tables if they don't exist
    if not os.path.exists(db_path):
        initialize_db()
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def initialize_db():
    conn = sqlite3.connect('db.sqlite')
    cur = conn.cursor()
    
    # Create users table if it doesn't exist
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL
        )
    ''')
    
    # Create services table if it doesn't exist
    cur.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL
        )
    ''')
    
    # Create bookings table if it doesn't exist
    cur.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (service_id) REFERENCES services (id)
        )
    ''')
    
    # Insert some default services
    default_services = [
        ('Haircut', 'Basic haircut service', 30.0),
        ('Hair Coloring', 'Professional hair coloring', 75.0),
        ('Manicure', 'Basic manicure service', 25.0),
        ('Pedicure', 'Basic pedicure service', 35.0),
        ('Facial', 'Rejuvenating facial treatment', 50.0)
    ]
    
    cur.executemany(
        'INSERT OR IGNORE INTO services (name, description, price) VALUES (?, ?, ?)',
        default_services
    )
    
    conn.commit()
    conn.close()

# User functions
def get_user_by_email(email: str) -> Optional[dict]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cur.fetchone()
    conn.close()
    return dict(user) if user else None

def check_user(email: str, password: str) -> Optional[dict]:
    conn = get_db()
    cur = conn.cursor()
    
    # First check if the user exists
    cur.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cur.fetchone()
    conn.close()
    
    # If user exists and password matches, return the user
    if user and user['password'] == password:
        return dict(user)
    return None

def create_user(email: str, password: str, full_name: str):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)', 
                   (email, password, full_name))
        conn.commit()
    except sqlite3.IntegrityError:
        # Handle case where email already exists
        conn.close()
        raise ValueError("Email already exists")
    conn.close()

# Service functions
def get_services() -> List[Dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM services')
    services = [dict(row) for row in cur.fetchall()]
    conn.close()
    return services

def get_service_by_id(service_id: int) -> Optional[dict]:
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM services WHERE id = ?', (service_id,))
    service = cur.fetchone()
    conn.close()
    return dict(service) if service else None

def create_service(name: str, description: str, price: float) -> int:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO services (name, description, price) VALUES (?, ?, ?)',
        (name, description, price)
    )
    service_id = cur.lastrowid
    conn.commit()
    conn.close()
    return service_id

# Booking functions
def create_booking(user_id: int, service_id: int, date: str, time: str, status: str = 'pending') -> int:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        'INSERT INTO bookings (user_id, service_id, date, time, status) VALUES (?, ?, ?, ?, ?)',
        (user_id, service_id, date, time, status)
    )
    booking_id = cur.lastrowid
    conn.commit()
    conn.close()
    return booking_id

def get_bookings(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db()
    cur = conn.cursor()
    
    if user_id:
        cur.execute('''
            SELECT b.*, s.name as service_name, s.price as service_price, u.email as user_email, u.full_name as user_full_name
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            JOIN users u ON b.user_id = u.id
            WHERE b.user_id = ?
        ''', (user_id,))
    else:
        cur.execute('''
            SELECT b.*, s.name as service_name, s.price as service_price, u.email as user_email, u.full_name as user_full_name
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            JOIN users u ON b.user_id = u.id
        ''')
    
    bookings = [dict(row) for row in cur.fetchall()]
    conn.close()
    return bookings

def update_booking_status(booking_id: int, status: str) -> bool:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        'UPDATE bookings SET status = ? WHERE id = ?',
        (status, booking_id)
    )
    success = cur.rowcount > 0
    conn.commit()
    conn.close()
    return success
