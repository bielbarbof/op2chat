#!/usr/bin/env python3
"""Instala as webfonts fornecidas pelo usuário na extensão OP2."""
from __future__ import annotations
import argparse
from pathlib import Path, PurePosixPath
import zipfile

ARPO = {
    'Arpona-Light.otf': 'arpona-light.otf',
    'Arpona-Regular.otf': 'arpona-regular.otf',
    'Arpona-Medium.otf': 'arpona-medium.otf',
    'Arpona-Bold.otf': 'arpona-bold.otf',
}
GIRA = {'Girassol-Regular.ttf': 'girassol-regular.ttf'}

def extract_by_basename(zip_path: Path, mapping: dict[str, str], out: Path):
    if not zip_path.exists():
        raise SystemExit(f'Arquivo não encontrado: {zip_path}')
    with zipfile.ZipFile(zip_path) as z:
        by_name = {PurePosixPath(name).name.casefold(): name for name in z.namelist() if not name.endswith('/')}
        missing=[]
        for expected,dst in mapping.items():
            src=by_name.get(expected.casefold())
            if not src:
                missing.append(expected)
                continue
            (out/dst).write_bytes(z.read(src))
        if missing:
            raise SystemExit(f'Arquivos esperados ausentes em {zip_path.name}: {missing}')

def main():
    ap=argparse.ArgumentParser(description='Instala Arpona e Girassol fornecidas pelo usuário como webfonts da extensão.')
    ap.add_argument('--arpona', default='arpona.zip', help='Caminho para arpona.zip')
    ap.add_argument('--girassol', default='Girassol.zip', help='Caminho para Girassol.zip')
    args=ap.parse_args()
    root=Path(__file__).resolve().parent
    out=root/'assets'/'fonts'
    out.mkdir(parents=True,exist_ok=True)
    extract_by_basename(Path(args.arpona).expanduser().resolve(), ARPO, out)
    extract_by_basename(Path(args.girassol).expanduser().resolve(), GIRA, out)
    print('Webfonts instaladas em:', out)
    print('Arpona Light/Regular/Medium/Bold + Girassol Regular prontas para o deploy.')

if __name__=='__main__':
    main()
