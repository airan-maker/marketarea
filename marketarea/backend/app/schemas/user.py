from pydantic import BaseModel


class EnsureUserRequest(BaseModel):
    google_id: str
    email: str
    name: str | None = None
    profile_image: str | None = None


class EnsureUserResponse(BaseModel):
    user_id: int
    is_new: bool
