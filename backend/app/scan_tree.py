from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass
class _Node:
    name: str
    type: str  # "file" | "directory"
    size: int = 0
    extension: str | None = None
    children: dict[str, "_Node"] = field(default_factory=dict)


def _guess_extension(name: str) -> str | None:
    if "." not in name or name.startswith("."):
        return None
    ext = name.rsplit(".", 1)[-1]
    return ext or None


def _finalize_sizes(node: _Node) -> int:
    if node.type == "file":
        return node.size
    total = 0
    for child in node.children.values():
        total += _finalize_sizes(child)
    node.size = total
    return total


def _to_disknode_dict(node: _Node) -> dict:
    if node.type == "file":
        return {
            "name": node.name,
            "size": node.size,
            "type": "file",
            "extension": node.extension,
        }
    children = [_to_disknode_dict(c) for c in node.children.values()]
    children.sort(key=lambda x: (x["type"] != "directory", -x["size"], x["name"]))
    return {
        "name": node.name,
        "size": node.size,
        "type": "directory",
        "children": children,
    }


def scan_directory(root_path: str, max_files: int) -> tuple[dict, int, int]:
    root_name = os.path.basename(os.path.abspath(root_path)) or root_path
    root = _Node(name=root_name, type="directory")
    file_count = 0
    total_size = 0

    def walk(path: str, node: _Node) -> None:
        nonlocal file_count, total_size
        if file_count >= max_files:
            return
        try:
            with os.scandir(path) as it:
                for entry in it:
                    if file_count >= max_files:
                        break
                    if entry.is_symlink():
                        continue
                    if entry.is_dir(follow_symlinks=False):
                        if entry.name.startswith("."):
                            continue
                        child = _Node(name=entry.name, type="directory")
                        node.children[entry.name] = child
                        walk(entry.path, child)
                    elif entry.is_file(follow_symlinks=False):
                        try:
                            size = entry.stat(follow_symlinks=False).st_size
                        except OSError:
                            size = 0
                        node.children[entry.name] = _Node(
                            name=entry.name,
                            type="file",
                            size=size,
                            extension=_guess_extension(entry.name),
                        )
                        file_count += 1
                        total_size += size
        except OSError:
            return

    walk(root_path, root)
    _finalize_sizes(root)
    return _to_disknode_dict(root), file_count, total_size
