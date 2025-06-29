from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint
from sqlalchemy import Column, TIMESTAMP

if TYPE_CHECKING:
    from .models import Group, Membership, Expense, ExpensePayer, ExpenseShare


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, nullable=False)
    name: str = Field(nullable=False)
    password_hash: str = Field(nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )

    # Groups the user has created.
    groups_created: List["Group"] = Relationship(back_populates="creator")

    # Groups the user has joined.
    memberships: List["Membership"] = Relationship(back_populates="user")

    # Expenses where this user paid money.
    expense_payers: List["ExpensePayer"] = Relationship(back_populates="user")

    # Expenses where this user owes money.
    expense_shares: List["ExpenseShare"] = Relationship(back_populates="user")


class Group(SQLModel, table=True):
    __tablename__ = "groups"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(nullable=False)
    created_by: int = Field(foreign_key="users.id", nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )

    # The user who created the group.
    creator: User = Relationship(back_populates="groups_created")

    # Users who are members of this group.
    memberships: List["Membership"] = Relationship(back_populates="group")

    # Expenses recorded in this group.
    expenses: List["Expense"] = Relationship(back_populates="group")


# Membership Table → joins User and Group
# Tracks which users are members of which groups
class Membership(SQLModel, table=True):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "group_id"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    group_id: int = Field(foreign_key="groups.id", nullable=False)

    # The user in this membership.
    user: User = Relationship(back_populates="memberships")

    # The group they joined.
    group: Group = Relationship(back_populates="memberships")


class Expense(SQLModel, table=True):
    __tablename__ = "expenses"

    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="groups.id", nullable=False)
    description: Optional[str] = Field(default=None)
    type: str = Field(default="regular")  # "regular" or "settlement"
    total_amount: float = Field(nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )

    # The group where the expense was made.
    group: Group = Relationship(back_populates="expenses")

    # Who paid, and how much.
    payers: List["ExpensePayer"] = Relationship(back_populates="expense")

    # Who owes, and how much.
    shares: List["ExpenseShare"] = Relationship(back_populates="expense")


# ExpensePayer Table → joins Expense and User
# Tracks who paid for a specific expense, and how much
class ExpensePayer(SQLModel, table=True):
    __tablename__ = "expense_payers"

    id: Optional[int] = Field(default=None, primary_key=True)
    expense_id: int = Field(foreign_key="expenses.id", nullable=False)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    paid_amount: float = Field(nullable=False)

    expense: Expense = Relationship(back_populates="payers")
    user: User = Relationship(back_populates="expense_payers")


# ExpenseShare Table → joins Expense and User
# Tracks how much each user owes (is responsible to share) in a specific expense
class ExpenseShare(SQLModel, table=True):
    __tablename__ = "expense_shares"

    id: Optional[int] = Field(default=None, primary_key=True)
    expense_id: int = Field(foreign_key="expenses.id", nullable=False)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    share_amount: float = Field(nullable=False)

    expense: Expense = Relationship(back_populates="shares")
    user: User = Relationship(back_populates="expense_shares")


class UserCreate(SQLModel):
    email: str
    password: str


class GroupInvitation(SQLModel, table=True):
    __tablename__ = "group_invitations"

    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="groups.id", nullable=False)
    invitee_email: str = Field(index=True, nullable=False)
    token: str = Field(unique=True, index=True, nullable=False)
    expires_at: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False)
    )
    status: str = Field(default="pending", nullable=False)  # e.g., pending, accepted, expired
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )

    group: Group = Relationship()


class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_reset_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    token: str = Field(unique=True, index=True, nullable=False)
    expires_at: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False)
    )
    used: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(TIMESTAMP(timezone=True), nullable=False),
    )

    user: User = Relationship()