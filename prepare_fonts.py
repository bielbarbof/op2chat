#!/usr/bin/env python3
"""Instala as webfonts do usuário na extensão OP2 sem depender de fontes locais."""
from __future__ import annotations
import argparse
from pathlib import Path
import zipfile

ARPO = {
    'arpona/Arpona-Light.otf': 'arpona-light.otf',
    'arpona/Arpona-Regular.otf': 'arpona-regular.otf',
    'arpona/Arpona-Bold.otf': 'arpona-bold.otf',
}
GIRA = {'Girassol-Regular.ttf': 'girassol-regular.ttf'}

def extract_selected(zip_path: Path, mapping: dict[str,str], out: Path):
    if not zip_path.exists():
        raise SystemExit(f'Arquivo não encontrado: {zip_path}')
    with zipfile.ZipFile(zip_path) as z:
        names=set(z.namelist())
        missing=[n for n in mapping if n not in names]
        if missing:
            raise SystemExit(f'Arquivos esperados ausentes em {zip_path.name}: {missing}')
        for src,dst in mapping.items():
            (out/dst).write_bytes(z.read(src))

def main():
    ap=argparse.ArgumentParser(description='Instala Arpona e Girassol fornecidas pelo usuário como webfonts da extensão.')
    ap.add_argument('--arpona', default='arpona.zip', help='Caminho para arpona.zip')
    ap.add_argument('--girassol', default='Girassol.zip', help='Caminho para Girassol.zip')
    args=ap.parse_args()
    root=Path(__file__).resolve().parent
    out=root/'assets'/'fonts'; out.mkdir(parents=True,exist_ok=True)
    extract_selected(Path(args.arpona).expanduser().resolve(), ARPO, out)
    extract_selected(Path(args.girassol).expanduser().resolve(), GIRA, out)
    print('Webfonts instaladas em:', out)
    print('Arpona Light/Regular/Bold + Girassol Regular prontas para o deploy.')
if __name__=='__main__': main()
