#!/usr/bin/env python3
"""Bundle verified Poly Haven CC0 material maps and a sky HDRI (stdlib only).

Downloads are staged; a failed API/file/image validation never installs a partial
asset set. Network access is needed on the build machine, not in the Android app.
"""
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import tempfile
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
API = 'https://api.polyhaven.com'
BUDGET = 40 * 1024 * 1024
ALLOWED_HOSTS = {'api.polyhaven.com', 'dl.polyhaven.org', 'cdn.polyhaven.com'}
MATERIALS = {
    'ground': ('asphalt_02',),
    'brick': ('brick_wall_001',),
    'plaster': ('plastered_wall_02', 'plastered_wall_03', 'plastered_wall'),
}
SKIES = ('kloppenheim_06_puresky', 'kloppenheim_02_puresky', 'kloofendal_48d_partly_cloudy_puresky')
MAP_KEYS = {
    'color': ('diffuse', 'diff', 'albedo', 'basecolor', 'base_color', 'color'),
    'normal': ('nor_gl', 'normal_gl', 'normal_opengl'),
    'roughness': ('rough', 'roughness'),
}
spent = 0


def safe_url(url):
    parsed = urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in ALLOWED_HOSTS or parsed.username or parsed.port not in (None, 443):
        raise ValueError('Unexpected asset URL: ' + url)
    return url


def download(url, mime_prefix, maximum):
    global spent
    safe_url(url)
    request = Request(url, headers={'User-Agent': 'Schifferstadt-SOPS-VisualAssets/0.3 (CC0 offline bundler)'})
    with urlopen(request, timeout=90) as response:
        safe_url(response.geturl())
        mime = response.headers.get_content_type().lower()
        accepted = any(mime.startswith(prefix) for prefix in mime_prefix)
        if not accepted:
            raise ValueError(f'Unexpected MIME {mime} for {url}')
        announced = response.headers.get('Content-Length')
        if announced and int(announced) > min(maximum, BUDGET - spent):
            raise ValueError('Download exceeds byte budget: ' + url)
        chunks, count = [], 0
        while True:
            chunk = response.read(min(65536, maximum - count + 1, BUDGET - spent + 1))
            if not chunk:
                break
            count += len(chunk)
            spent += len(chunk)
            if count > maximum or spent > BUDGET:
                raise ValueError('40 MiB total / per-file download budget exceeded')
            chunks.append(chunk)
        if not count:
            raise ValueError('Empty response: ' + url)
        return b''.join(chunks), mime


def api(path):
    raw, _ = download(API + path, ('application/json',), 5 * 1024 * 1024)
    value = json.loads(raw)
    if not isinstance(value, dict) or not value:
        raise ValueError('Invalid Poly Haven API response: ' + path)
    return value


def choose(registry, candidates):
    for asset in candidates:
        if asset in registry:
            return asset
    raise ValueError('No requested asset in official registry: ' + ', '.join(candidates))


def file_entry(files, aliases, extension):
    lookup = {key.lower(): value for key, value in files.items()}
    for alias in aliases:
        resolutions = lookup.get(alias)
        if not isinstance(resolutions, dict):
            continue
        versions = resolutions.get('1k', {})
        entry = versions.get(extension) if isinstance(versions, dict) else None
        if isinstance(entry, dict) and isinstance(entry.get('url'), str):
            return entry
    raise ValueError(f'Official API has no 1k {extension} map for {aliases}')


def jpeg_size(data):
    if not data.startswith(b'\xff\xd8') or not data.endswith(b'\xff\xd9'):
        raise ValueError('Invalid or truncated JPEG')
    offset = 2
    while offset < len(data):
        if data[offset] != 255:
            raise ValueError('Malformed JPEG marker')
        while offset < len(data) and data[offset] == 255:
            offset += 1
        marker = data[offset]
        offset += 1
        if marker in (0x01, *range(0xD0, 0xDA)):
            continue
        if offset + 2 > len(data):
            break
        length = struct.unpack_from('>H', data, offset)[0]
        if length < 2 or offset + length > len(data):
            raise ValueError('Malformed JPEG segment')
        if marker in (0xC0, 0xC1, 0xC2):
            if length < 8:
                raise ValueError('Invalid JPEG frame')
            height, width = struct.unpack_from('>HH', data, offset + 3)
            return width, height
        if marker == 0xDA:
            break
        offset += length
    raise ValueError('JPEG dimensions unavailable')


def validate(data, kind):
    if kind == 'hdr':
        header = data[:4096]
        if not header.startswith((b'#?RADIANCE', b'#?RGBE')) or b'FORMAT=32-bit_rle_rgbe' not in header:
            raise ValueError('Invalid Radiance HDR header')
        match = re.search(rb'[-+]Y\s+(\d+)\s+[-+]X\s+(\d+)', header)
        if not match:
            raise ValueError('HDR dimensions unavailable')
        height, width = map(int, match.groups())
    else:
        width, height = jpeg_size(data)
    if not (128 <= width <= 2048 and 128 <= height <= 2048 and max(width, height) == 1024):
        raise ValueError(f'Expected genuine 1k asset, got {width}x{height}')
    return {'width': width, 'height': height}


def fetch_file(stage, filename, entry, kind, asset_id, role):
    url = safe_url(entry['url'])
    mime_types = ('image/jpeg',) if kind == 'jpg' else ('image/vnd.radiance', 'image/x-hdr', 'image/hdr', 'application/octet-stream', 'binary/octet-stream')
    data, mime = download(url, mime_types, 8 * 1024 * 1024)
    dimensions = validate(data, kind)
    if isinstance(entry.get('size'), int) and entry['size'] != len(data):
        raise ValueError('Asset length differs from official API: ' + filename)
    if entry.get('md5') and hashlib.md5(data).hexdigest().lower() != entry['md5'].lower():
        raise ValueError('Asset MD5 differs from official API: ' + filename)
    (stage / filename).write_bytes(data)
    return {'path': 'textures/' + filename, 'asset_id': asset_id, 'role': role,
            'url': url, 'bytes': len(data), 'mime': mime, **dimensions,
            'sha256': hashlib.sha256(data).hexdigest(),
            'color_space': 'sRGB' if role == 'color' else 'linear',
            **({'convention': 'OpenGL (+Y)'} if role == 'normal' else {})}


def main():
    textures = api('/assets?t=textures')
    skies = api('/assets?t=hdris')
    target = ROOT / 'dist' / 'textures'
    target.parent.mkdir(parents=True, exist_ok=True)
    manifest = {'provider': 'Poly Haven', 'license': 'CC0-1.0',
        'license_url': 'https://polyhaven.com/license',
        'license_text_url': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'api': API, 'files': [], 'assets': {}, 'offline': True,
        'note': 'Scanned surface materials and a sky environment only; not photographs or reconstructions of any real school.'}
    with tempfile.TemporaryDirectory(prefix='.visual-assets-', dir=target.parent) as temp:
        stage = Path(temp)
        for role, candidates in MATERIALS.items():
            asset_id = choose(textures, candidates)
            info, files = api('/info/' + asset_id), api('/files/' + asset_id)
            manifest['assets'][asset_id] = {'page': 'https://polyhaven.com/a/' + asset_id, 'info': info}
            for output, aliases in MAP_KEYS.items():
                entry = file_entry(files, aliases, 'jpg')
                manifest['files'].append(fetch_file(stage, f'{role}-{output}.jpg', entry, 'jpg', asset_id, output))
        sky = choose(skies, SKIES)
        manifest['assets'][sky] = {'page': 'https://polyhaven.com/a/' + sky, 'info': api('/info/' + sky)}
        entry = file_entry(api('/files/' + sky), ('hdri',), 'hdr')
        manifest['files'].append(fetch_file(stage, 'sky.hdr', entry, 'hdr', sky, 'environment'))
        manifest['download_bytes_including_api'] = spent
        (stage / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        (stage / 'LICENSE.txt').write_text('Poly Haven assets: CC0 1.0 Universal\nhttps://polyhaven.com/license\nhttps://creativecommons.org/publicdomain/zero/1.0/\n\nAsset identities, author metadata, official download URLs and file hashes: manifest.json.\nThese files contain generic surface materials and a sky environment; no real school photos.\n', encoding='utf-8')
        # All ten assets must be validated before touching the installed set.
        target.mkdir(exist_ok=True)
        for path in stage.iterdir():
            shutil.copyfile(path, target / (path.name + '.tmp'))
        for path in stage.iterdir():
            (target / (path.name + '.tmp')).replace(target / path.name)
    print(f'Validated and bundled 9 material maps + 1 HDRI, CC0; {spent:,} downloaded bytes. Manifest: {target / "manifest.json"}')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        raise SystemExit(f'Visual asset preparation FAILED: {error}. No successful asset set is claimed.')
