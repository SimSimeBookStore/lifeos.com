from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent

max_dimensions = {
    'icon.png': 512,
    'dash.png': 1200,
}

for path in [root / 'icon.png', *sorted((root / 'assets' / 'images').glob('*'))]:
    if not path.is_file():
        continue
    suffix = path.suffix.lower()
    if suffix not in {'.png', '.jpg', '.jpeg'}:
        continue

    try:
        with Image.open(path) as img:
            if suffix in {'.jpg', '.jpeg'}:
                rgb = img.convert('RGB')
            else:
                rgb = img

            max_dim = max_dimensions.get(path.name.lower(), 1200)
            if max(rgb.size) > max_dim:
                scale = max_dim / max(rgb.size)
                new_size = (
                    max(1, int(rgb.size[0] * scale)),
                    max(1, int(rgb.size[1] * scale)),
                )
                rgb = rgb.resize(new_size, Image.Resampling.LANCZOS)

            if suffix in {'.jpg', '.jpeg'}:
                rgb.save(path, format='JPEG', quality=68, optimize=True, progressive=True)
            else:
                rgb.save(path, format='PNG', optimize=True, compress_level=9)

            print(f'{path.relative_to(root)} -> {path.stat().st_size} bytes')
    except Exception as exc:
        print(f'Failed to optimize {path}: {exc}')
