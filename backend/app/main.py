from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    EchoIn,
    EchoOut,
    HealthOut,
    SampleDiskOut,
    ScanDirectoryIn,
    ScanDirectoryOut,
)
from .sample_data import get_sample_disk
from .palette import generate_palette
from .scan_tree import scan_directory

app = FastAPI(title="diskviz-dashboard-backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthOut)
def health() -> HealthOut:
    return HealthOut()


@app.post("/api/echo", response_model=EchoOut)
def echo(body: EchoIn) -> EchoOut:
    return EchoOut(text=body.text, length=len(body.text))


@app.get("/api/sample-disk", response_model=SampleDiskOut)
def sample_disk() -> SampleDiskOut:
    return get_sample_disk()


@app.post("/api/scan-directory", response_model=ScanDirectoryOut)
def scan_directory_endpoint(body: ScanDirectoryIn) -> ScanDirectoryOut:
    path = os.path.abspath(body.path)
    root, file_count, total_size = scan_directory(path, body.max_files)
    children = root.get("children") or []
    group_names = [child.get("name") for child in children if child.get("name")]
    group_colors: dict[str, str] = {}
    if group_names:
        try:
            palette = generate_palette(len(group_names))
            group_colors = {name: palette[idx] for idx, name in enumerate(group_names) if idx < len(palette)}
        except Exception:
            group_colors = {}
    return ScanDirectoryOut(
        root=root,
        file_count=file_count,
        total_size=total_size,
        group_colors=group_colors,
    )
