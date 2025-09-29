from fastapi import FastAPI, Depends, HTTPException, status, Query, APIRouter
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import db
import uvicorn

# The FastAPI instance is created here and named 'app'.
# The error occurs if you try to run uvicorn telling it to look for 'fast'.
# Correct command: uvicorn fast:app --reload
app = FastAPI()

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security & Auth ---
security = HTTPBasic()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    user = db.get_user_by_email(credentials.username)
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    user_with_role = dict(user)
    user_with_role["isAdmin"] = bool(user.get("is_admin"))
    return user_with_role

def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    if not current_user.get("isAdmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Requires admin privileges")
    return current_user

# --- Pydantic Models ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class BookingCreate(BaseModel):
    service_id: int
    date: str
    time: str

class BookingUpdate(BaseModel):
    status: str

class ServiceUpdate(BaseModel):
    status: str

class StaffCreate(BaseModel):
    full_name: str
    specialty: str

class RoomCreate(BaseModel):
    room_number: str
    type: str
    price_per_night: float = Field(..., gt=0)

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

# --- Main API Endpoints ---
@app.post("/token")
def get_token(user: dict = Depends(get_current_user)):
    """Provides a token-like object confirming user authentication."""
    user_data = user.copy()
    if "password" in user_data:
        del user_data["password"]
    return user_data

@app.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(user: UserCreate):
    """Handles new user registration."""
    if db.get_user_by_email(user.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    try:
        db.create_user(user.email, hashed_password, user.full_name)
        return {"message": "User created successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# --- Routers for Organization ---
services_router = APIRouter(prefix="/services", tags=["services"])
bookings_router = APIRouter(prefix="/bookings", tags=["bookings"])
staff_router = APIRouter(prefix="/staff", tags=["staff"])
rooms_router = APIRouter(prefix="/rooms", tags=["rooms"])
reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])

# --- Services Routes ---
@services_router.get("/")
async def get_services(status: Optional[str] = Query(None)):
    return db.get_services(status=status)

@services_router.put("/{service_id}")
async def update_service_status(service_id: int, service_update: ServiceUpdate, admin: dict = Depends(get_current_admin_user)):
    if not db.update_service_status(service_id, service_update.status):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return {"message": f"Service {service_id} status updated to {service_update.status}"}

# --- Bookings Routes ---
@bookings_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingCreate, current_user: dict = Depends(get_current_user)):
    if not db.get_service_by_id(booking.service_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    booking_id = db.create_booking(current_user["id"], booking.service_id, booking.date, booking.time)
    return {"id": booking_id, **booking.dict()}

@bookings_router.get("/")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    if current_user["isAdmin"]:
        return db.get_bookings()
    else:
        return db.get_bookings(user_id=current_user["id"])

@bookings_router.put("/{booking_id}")
async def update_booking(booking_id: int, booking_update: BookingUpdate, admin: dict = Depends(get_current_admin_user)):
    if not db.update_booking_status(booking_id, booking_update.status):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return {"message": "Booking updated successfully"}

# --- Staff Routes (Admin Only) ---
@staff_router.post("/", status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
async def create_staff(staff: StaffCreate):
    staff_id = db.create_staff(staff.full_name, staff.specialty)
    return {"id": staff_id, **staff.dict()}

@staff_router.get("/", dependencies=[Depends(get_current_admin_user)])
async def get_staff():
    return db.get_staff()

# --- Rooms Routes (Admin Only) ---
@rooms_router.post("/", status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
async def create_room(room: RoomCreate):
    room_id = db.create_room(room.room_number, room.type, room.price_per_night)
    return {"id": room_id, **room.dict()}

@rooms_router.get("/", dependencies=[Depends(get_current_admin_user)])
async def get_rooms():
    return db.get_rooms()

# --- Reviews Routes ---
@reviews_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    review_id = db.create_review(review.booking_id, current_user["id"], review.rating, review.comment)
    return {"id": review_id, **review.dict()}

@reviews_router.get("/")
async def get_reviews():
    return db.get_reviews()

analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])

# --- Analytics Routes (Admin Only) ---
@analytics_router.get("/revenue", dependencies=[Depends(get_current_admin_user)])
async def get_revenue(days: int = 30):
    return db.get_revenue_data(days)

@analytics_router.get("/services", dependencies=[Depends(get_current_admin_user)])
async def get_service_usage(days: int = 30):
    """
    NEW ENDPOINT: Provides data on how many times each service was booked.
    """
    return db.get_service_usage_data(days)

@analytics_router.get("/occupancy", dependencies=[Depends(get_current_admin_user)])
async def get_occupancy():
    """
    NEW ENDPOINT: Provides data on current room occupancy status.
    """
    return db.get_occupancy_data()

class RoomStatusUpdate(BaseModel):
    status: str

# --- Routers for Organization ---
# ... (services_router, bookings_router, etc.) ...
rooms_router = APIRouter(
    prefix="/rooms", 
    tags=["rooms"], 
    dependencies=[Depends(get_current_admin_user)]
)
staff_router = APIRouter(
    prefix="/staff", 
    tags=["staff"], 
    dependencies=[Depends(get_current_admin_user)]
)

# --- Rooms Routes (Admin Only) ---
@rooms_router.get("/")
async def get_all_rooms():
    return db.get_rooms()

@rooms_router.put("/{room_id}/status")
async def update_room_status_endpoint(room_id: int, status_update: RoomStatusUpdate):
    if not db.update_room_status(room_id, status_update.status):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return {"message": f"Room {room_id} status updated to {status_update.status}"}

# --- Staff Routes (Admin Only) ---
@staff_router.get("/")
async def get_all_staff():
    return db.get_staff()

@staff_router.post("/")
async def create_new_staff(staff: StaffCreate):
    staff_id = db.create_staff(staff.full_name, staff.specialty)
    # Return the full staff object including the new ID
    return {"id": staff_id, **staff.dict()}


app.include_router(services_router)
app.include_router(bookings_router)
app.include_router(staff_router)
app.include_router(rooms_router)
app.include_router(reviews_router)
app.include_router(analytics_router)

# --- Run the application ---
if __name__ == "__main__":
    db.initialize_db() # Ensure DB is ready on startup
    # This block allows you to run the app directly with 'python fast.py'
    uvicorn.run("fast:app", host="0.0.0.0", port=8000, reload=True)
