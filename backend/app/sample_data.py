from __future__ import annotations

from .models import DiskNode, SampleDiskOut


def get_sample_disk() -> SampleDiskOut:
    root = DiskNode(
        name="root",
        type="directory",
        size=1_786_432_000,
        children=[
            DiskNode(
                name="System",
                type="directory",
                size=734_003_200,
                children=[
                    DiskNode(name="kernel.bin", type="file", size=120_000_000, extension="bin"),
                    DiskNode(name="drivers", type="directory", size=320_000_000, children=[]),
                    DiskNode(name="Logs", type="directory", size=294_003_200, children=[]),
                ],
            ),
            DiskNode(
                name="Users",
                type="directory",
                size=1_052_428_800,
                children=[
                    DiskNode(
                        name="alice",
                        type="directory",
                        size=752_428_800,
                        children=[
                            DiskNode(name="photo.jpg", type="file", size=30_000_000, extension="jpg"),
                            DiskNode(name="report.pdf", type="file", size=5_000_000, extension="pdf"),
                            DiskNode(name="Downloads", type="directory", size=717_428_800, children=[]),
                        ],
                    ),
                    DiskNode(
                        name="bob",
                        type="directory",
                        size=300_000_000,
                        children=[
                            DiskNode(name="video.mp4", type="file", size=280_000_000, extension="mp4"),
                            DiskNode(name="notes.txt", type="file", size=2_000_000, extension="txt"),
                        ],
                    ),
                ],
            ),
        ],
    )
    return SampleDiskOut(root=root)

