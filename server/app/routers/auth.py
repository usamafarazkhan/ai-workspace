from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models import User, ProjectMember, generate_public_member_id
from app.schemas import UserResponse, UserCreate, UserSwitchRequest

router = APIRouter(tags=["auth"])

@router.get("/auth/users", response_model=List[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    if not users:
        # Create default user if none exists
        default_user = User(
            public_member_id="USR-LEAD-7K2M9A",
            email="alex@devworkspace.ai",
            full_name="Alex Tech Lead",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            availability_status="online",
            role="Lead Software Architect",
            permissions=["all", "admin", "chat", "code", "architecture", "publish"]
        )
        db.add(default_user)
        await db.commit()
        await db.refresh(default_user)
        return default_user
    return users[0]

@router.post("/auth/switch-active-member", response_model=UserResponse)
async def switch_active_member(payload: UserSwitchRequest, db: AsyncSession = Depends(get_db)):
    """
    Allows the user or team lead to switch active view context to any invited project member
    (e.g., test workspace & AI from perspective of Muhammad Fahad - Frontend Developer [USR-FE-7A29X4]).
    """
    result = await db.execute(select(User))
    users = result.scalars().all()
    user = users[0] if users else None

    if not user:
        user = User(
            email=payload.email or "fahad@workspace.dev",
            full_name=payload.full_name or "Muhammad Fahad",
            role=payload.role or "Frontend Developer",
            public_member_id=payload.member_id or generate_public_member_id(payload.role)
        )
        db.add(user)
    else:
        if payload.full_name:
            user.full_name = payload.full_name
        if payload.email:
            user.email = payload.email
        if payload.role:
            user.role = payload.role
        if payload.member_id:
            user.public_member_id = payload.member_id
        elif payload.role:
            user.public_member_id = generate_public_member_id(payload.role)

    await db.commit()
    await db.refresh(user)
    return user

@router.post("/auth/register", response_model=UserResponse)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = generate_public_member_id(payload.role)
    user = User(
        public_member_id=user_id,
        email=payload.email,
        full_name=payload.full_name,
        avatar_url=payload.avatar_url,
        availability_status=payload.availability_status,
        role=payload.role,
        permissions=payload.permissions or ["chat", "tasks", "read_artifacts"]
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
