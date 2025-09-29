import sqlite3
import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

def get_db():
    """Establishes and returns a database connection."""
    db_path = 'db.sqlite'
    if not os.path.exists(db_path):
        initialize_db()
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def initialize_db():
    """Initializes the database with a full schema and default data."""
    conn = sqlite3.connect('db.sqlite')
    cur = conn.cursor()
    
    # --- People & Roles ---
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            phone_number TEXT,
            address TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            specialty TEXT,
            email TEXT UNIQUE,
            phone_number TEXT
        )
    ''')

    # --- Services & Products ---
    cur.execute('''
        CREATE TABLE IF NOT EXISTS service_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            status TEXT DEFAULT 'active',
            FOREIGN KEY (category_id) REFERENCES service_categories (id)
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS staff_services (
            staff_id INTEGER NOT NULL,
            service_id INTEGER NOT NULL,
            PRIMARY KEY (staff_id, service_id),
            FOREIGN KEY (staff_id) REFERENCES staff (id),
            FOREIGN KEY (service_id) REFERENCES services (id)
        )
    ''')

    # --- Bookings & Hospitality ---
    cur.execute('''
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            price_per_night REAL NOT NULL,
            status TEXT DEFAULT 'available' -- available, occupied, maintenance
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            service_id INTEGER,
            room_id INTEGER,
            staff_id INTEGER,
            date TEXT NOT NULL,
            time TEXT,
            status TEXT NOT NULL, -- pending, confirmed, completed, cancelled
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (service_id) REFERENCES services (id),
            FOREIGN KEY (room_id) REFERENCES rooms (id),
            FOREIGN KEY (staff_id) REFERENCES staff (id)
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS booking_products (
            booking_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            PRIMARY KEY (booking_id, product_id),
            FOREIGN KEY (booking_id) REFERENCES bookings (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )
    ''')

    # --- Financial & Feedback ---
    cur.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            status TEXT DEFAULT 'completed',
            FOREIGN KEY (booking_id) REFERENCES bookings (id)
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # --- Insert Default Data ---
    try:
        cur.execute("SELECT COUNT(*) FROM users WHERE email = 'admin@gmail.com'")
        if cur.fetchone()[0] == 0:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            hashed_password = pwd_context.hash("adminpass")
            cur.execute("INSERT INTO users (email, password, full_name, is_admin) VALUES (?, ?, ?, ?)",
                        ('admin@gmail.com', hashed_password, 'Admin User', 1))

        cur.execute("SELECT COUNT(*) FROM service_categories")
        if cur.fetchone()[0] == 0:
            cur.executemany('INSERT INTO service_categories (name) VALUES (?)', 
                            [('Hair Styling',), ('Nail Care',), ('Skin Care',)])
        
        cur.execute("SELECT COUNT(*) FROM services")
        if cur.fetchone()[0] == 0:
            cur.executemany('INSERT INTO services (category_id, name, description, price) VALUES (?, ?, ?, ?)', [
                (1, 'Haircut', 'Basic haircut service', 30.0),
                (1, 'Hair Coloring', 'Professional hair coloring', 75.0),
                (2, 'Manicure', 'Classic manicure service', 25.0),
                (3, 'Facial', 'Rejuvenating facial treatment', 50.0)
            ])
            
        cur.execute("SELECT COUNT(*) FROM staff")
        if cur.fetchone()[0] == 0:
            cur.executemany('INSERT INTO staff (full_name, specialty) VALUES (?, ?)',
                            [('Alice Johnson', 'Stylist'), ('Bob Williams', 'Nail Technician')])
            
        cur.execute("SELECT COUNT(*) FROM rooms")
        if cur.fetchone()[0] == 0:
            cur.executemany('INSERT INTO rooms (room_number, type, price_per_night, status) VALUES (?, ?, ?, ?)', [
                ('101', 'Standard Single', 100.0, 'available'),
                ('102', 'Standard Double', 150.0, 'occupied'),
                ('201', 'Deluxe Suite', 250.0, 'maintenance')
            ])

        conn.commit()
    finally:
        conn.close()

# --- User Functions ---
def get_user_by_email(email: str) -> Optional[dict]:
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    return dict(user) if user else None

def create_user(email: str, password_hash: str, full_name: str):
    conn = get_db()
    try:
        conn.execute('INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)',
                     (email, password_hash, full_name))
        conn.commit()
    except sqlite3.IntegrityError:
        raise ValueError("Email already exists")
    finally:
        conn.close()

# --- Service Functions ---
def get_services(status: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db()
    query = 'SELECT s.*, sc.name as category_name FROM services s LEFT JOIN service_categories sc ON s.category_id = sc.id'
    params = []
    if status:
        query += ' WHERE s.status = ?'
        params.append(status)
    services = [dict(row) for row in conn.execute(query, params).fetchall()]
    conn.close()
    return services

def get_service_by_id(service_id: int) -> Optional[dict]:
    conn = get_db()
    service = conn.execute('SELECT * FROM services WHERE id = ?', (service_id,)).fetchone()
    conn.close()
    return dict(service) if service else None

def update_service_status(service_id: int, status: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE services SET status = ? WHERE id = ?', (status, service_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success
    
# --- Booking Functions ---
def create_booking(user_id: int, service_id: int, date: str, time: str, status: str = 'pending') -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO bookings (user_id, service_id, date, time, status) VALUES (?, ?, ?, ?, ?)',
                   (user_id, service_id, date, time, status))
    booking_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return booking_id

def get_bookings(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db()
    query = '''
        SELECT b.*, s.name as service_name, u.full_name as user_full_name, st.full_name as staff_name
        FROM bookings b
        LEFT JOIN services s ON b.service_id = s.id
        LEFT JOIN users u ON b.user_id = u.id
        LEFT JOIN staff st ON b.staff_id = st.id
    '''
    params = ()
    if user_id:
        query += ' WHERE b.user_id = ?'
        params = (user_id,)
    bookings = [dict(row) for row in conn.execute(query, params).fetchall()]
    conn.close()
    return bookings

def update_booking_status(booking_id: int, status: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE bookings SET status = ? WHERE id = ?', (status, booking_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

# --- Staff Functions ---
def create_staff(full_name: str, specialty: str) -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO staff (full_name, specialty) VALUES (?, ?)', (full_name, specialty))
    staff_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return staff_id

def get_staff() -> List[Dict[str, Any]]:
    conn = get_db()
    staff_list = [dict(row) for row in conn.execute('SELECT * FROM staff').fetchall()]
    conn.close()
    return staff_list

# --- Room Functions ---
def create_room(room_number: str, type: str, price_per_night: float) -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO rooms (room_number, type, price_per_night) VALUES (?, ?, ?)',
                   (room_number, type, price_per_night))
    room_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return room_id

def get_rooms() -> List[Dict[str, Any]]:
    conn = get_db()
    rooms_list = [dict(row) for row in conn.execute('SELECT * FROM rooms').fetchall()]
    conn.close()
    return rooms_list

# --- Review Functions ---
def create_review(booking_id: int, user_id: int, rating: int, comment: str) -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO reviews (booking_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
                   (booking_id, user_id, rating, comment))
    review_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return review_id

def get_reviews() -> List[Dict[str, Any]]:
    conn = get_db()
    reviews = [dict(row) for row in conn.execute('''
        SELECT r.*, u.full_name as author_name, s.name as service_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN services s ON b.service_id = s.id
        ORDER BY r.created_at DESC
    ''').fetchall()]
    conn.close()
    return reviews

# --- Analytics Functions ---
def get_revenue_data(days: int) -> Dict[str, Any]:
    conn = get_db()
    date_limit = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    rows = conn.execute('''
        SELECT b.date, SUM(s.price) as daily_revenue FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'completed' AND b.date >= ? GROUP BY b.date ORDER BY b.date ASC
    ''', (date_limit,)).fetchall()
    conn.close()
    return {
        "labels": [row['date'] for row in rows],
        "datasets": [{"label": "Daily Revenue", "data": [row['daily_revenue'] for row in rows]}]
    }

def get_revenue_data(days: int) -> Dict[str, Any]:
    conn = get_db()
    date_limit = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    rows = conn.execute('''
        SELECT b.date, SUM(s.price) as daily_revenue FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.status = 'completed' AND b.date >= ? GROUP BY b.date ORDER BY b.date ASC
    ''', (date_limit,)).fetchall()
    conn.close()
    
    labels = [row['date'] for row in rows]
    data = [row['daily_revenue'] for row in rows]
    
    return {
        "labels": labels,
        "datasets": [{
            "label": "Daily Revenue",
            "data": data,
            "backgroundColor": "rgba(75, 192, 192, 0.6)",
            "borderColor": "rgba(75, 192, 192, 1)",
            "borderWidth": 1
        }]
    }

def get_service_usage_data(days: int) -> Dict[str, Any]:
    conn = get_db()
    date_limit = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    rows = conn.execute('''
        SELECT s.name as service_name, COUNT(b.id) as booking_count
        FROM bookings b JOIN services s ON b.service_id = s.id
        WHERE b.date >= ? AND b.service_id IS NOT NULL
        GROUP BY s.name ORDER BY booking_count DESC
    ''', (date_limit,)).fetchall()
    conn.close()

    labels = [row['service_name'] for row in rows]
    data = [row['booking_count'] for row in rows]

    return {
        "labels": labels,
        "datasets": [{
            "label": "Bookings per Service",
            "data": data,
            "backgroundColor": [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
        }]
    }

def get_occupancy_data() -> Dict[str, Any]:
    """
    Calculates room occupancy rates.
    """
    conn = get_db()
    rows = conn.execute('''
        SELECT status, COUNT(id) as count
        FROM rooms
        GROUP BY status
    ''').fetchall()
    conn.close()

    labels = [row['status'].capitalize() for row in rows]
    data = [row['count'] for row in rows]

    # This is the color mapping object
    color_map = {
        'Available': 'rgba(40, 167, 69, 0.7)',
        'Occupied': 'rgba(220, 53, 69, 0.7)',
        'Maintenance': 'rgba(255, 193, 7, 0.7)',
    }
    
    background_colors = [color_map.get(label, '#cccccc') for label in labels]

    return {
        "labels": labels,
        "datasets": [{
            "label": "Room Status",
            "data": data,
            "backgroundColor": background_colors,
            "borderColor": '#fff',
            "borderWidth": 2
        }]
    }

def update_room_status(room_id: int, status: str) -> bool:
    """
    Updates the status of a specific room in the database.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE rooms SET status = ? WHERE id = ?', (status, room_id))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success