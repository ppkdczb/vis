from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


class HealthOut(BaseModel):
    status: Literal["ok"] = "ok"
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EchoIn(BaseModel):
    text: str = Field(min_length=0, max_length=10_000)


class EchoOut(BaseModel):
    text: str
    length: int


class DiskNode(BaseModel):
    name: str
    size: int
    type: Literal["file", "directory"]
    extension: str | None = None
    children: list["DiskNode"] | None = None


class SampleDiskOut(BaseModel):
    root: DiskNode


class ScanDirectoryIn(BaseModel):
    path: str = Field(min_length=1, max_length=4096)
    max_files: int = Field(default=20000, ge=1, le=200000)


class ScanDirectoryOut(BaseModel):
    root: DiskNode
    file_count: int
    total_size: int
    group_colors: dict[str, str] = Field(default_factory=dict)
