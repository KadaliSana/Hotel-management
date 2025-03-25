from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import db
import uvicorn
import secrets

fast = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add any other origins you need
]

fast.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBasic()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models for request validation
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class ServiceCreate(BaseModel):
    name: str
    description: str
    price: float

class BookingCreate(BaseModel):
    service_id: int
    date: str
    time: str

class BookingUpdate(BaseModel):
    status: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_current_user(credentials: HTTPBasicCredentials = Depends(security)):
    user = db.get_user_by_email(credentials.username)
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return user

@fast.post("/login")
def login(credentials: HTTPBasicCredentials = Depends(security)):
    user = get_current_user(credentials)
    # Remove password from response
    user_data = user.copy()
    if "password" in user_data:
        del user_data["password"]
    # Add isAdmin flag
    user_data["isAdmin"] = user["email"] == "admin@gmail.com"
    return user_data

@fast.post("/users/", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    # Check if user already exists
    existing_user = db.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create user in database
    try:
        db.create_user(user.email, hashed_password, user.full_name)
        return {"message": "User created successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@fast.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # Remove sensitive information before returning
    user_data = current_user.copy()
    if "password" in user_data:
        del user_data["password"]
    return user_data

# Services endpoints
@fast.get("/services/")
async def get_services():
    return db.get_services()

@fast.post("/services/", status_code=status.HTTP_201_CREATED)
async def create_service(service: ServiceCreate, current_user: dict = Depends(get_current_user)):
    # Only admin can create services (assuming admin has email admin@admin.com)
    if current_user["email"] != "admin@admin.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create services"
        )
    
    service_id = db.create_service(service.name, service.description, service.price)
    return {"id": service_id, "message": "Service created successfully"}

# Bookings endpoints
@fast.post("/bookings/", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: BookingCreate, current_user: dict = Depends(get_current_user)):
    # Check if service exists
    service = db.get_service_by_id(booking.service_id)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    booking_id = db.create_booking(
        user_id=current_user["id"],
        service_id=booking.service_id,
        date=booking.date,
        time=booking.time
    )
    
    return {"id": booking_id, "message": "Booking created successfully"}

@fast.get("/bookings/")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    # If admin, return all bookings, otherwise return only user's bookings
    if current_user["email"] == "admin@admin.com":
        return db.get_bookings()
    else:
        return db.get_bookings(user_id=current_user["id"])

@fast.put("/bookings/{booking_id}")
async def update_booking(booking_id: int, booking_update: BookingUpdate, current_user: dict = Depends(get_current_user)):
    # Only admin can update booking status
    if current_user["email"] != "admin@admin.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update booking status"
        )
    
    success = db.update_booking_status(booking_id, booking_update.status)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    return {"message": "Booking updated successfully"}

# Add a main function to run the application
if __name__ == "__main__":
    uvicorn.run("fast:fast", host="0.0.0.0", port=8000, reload=True)
