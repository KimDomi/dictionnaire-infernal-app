import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(fileURLToPath(import.meta.url));
mkdirSync(path.join(root,'dist/plates'),{recursive:true});

const py=`
import os, subprocess, tempfile
from PIL import Image, ImageOps

root = ${JSON.stringify(root)}
out_dir = os.path.join(root, "dist/plates")
os.makedirs(out_dir, exist_ok=True)

with tempfile.TemporaryDirectory() as tmp:
    subprocess.run(["pdfimages", "-j", "-f", "1", "-l", "17", os.path.join(root, "resources/dictionnaire_infernal_illustrations.pdf"), os.path.join(tmp, "img")], check=True)
    pairs = [
        (1, "abraxas", "adramelech"),
        (2, "aguares", "alastor"),
        (3, "alocer", "amduscias"),
        (4, "amon", "andras"),
        (5, "asmodee", "astaroth"),
        (6, "azazel", "bael"),
        (7, "balan", "barbatos"),
        (8, "behemoth", "belphegor"),
        (9, "belzebuth", "berith"),
        (10, "caacrinolaas", "cali"),
        (11, "caym", "cerbere"),
        (12, "crapaud", "sabbath"),
        (13, "deumus", "eurynome"),
        (14, "flaga", "flauros"),
        (15, "forcas", "furfur"),
        (16, "ganga-gramma", "garuda"),
        (17, "gomory", "haborym"),
        (18, "ipes", "lamia"),
        (19, "lechies", "leonard"),
        (20, "lucifer", "malphas"),
        (21, "mammon", "marchocias"),
        (22, "melchom", "moloch"),
        (23, "mycale", "nickar"),
        (24, "nybbas", "orobas"),
        (25, "paymon", "picollus"),
        (26, "pruflas", "rahouart"),
        (27, "ribesal", "ronwe"),
        (28, "scox", "stolas"),
        (29, "tap", "torngarsuk"),
        (30, "transport-sorcerers", "ukobach"),
        (31, "volac", "voyages-sorcerers"),
        (32, "wall", "xaphan"),
        (33, "yan-gant-y-tan", "zaebos"),
    ]
    im0 = Image.open(os.path.join(tmp, "img-000.jpg"))
    w0, h0 = im0.size
    im0.crop((0, 0, w0, int(h0 * 0.84))).save(os.path.join(out_dir, "abigor.jpg"), quality=82, optimize=True)
    for idx, left_slug, right_slug in pairs:
        im = Image.open(os.path.join(tmp, f"img-{idx:03d}.jpg"))
        w, h = im.size
        crop_h = int(h * 0.84)
        im.crop((4, 4, int(w * 0.465), crop_h)).save(os.path.join(out_dir, f"{left_slug}.jpg"), quality=82, optimize=True)
        im.crop((int(w * 0.535), 4, w - 4, crop_h)).save(os.path.join(out_dir, f"{right_slug}.jpg"), quality=82, optimize=True)

    full_pdf = os.path.join(root, "resources/dictionnaire_infernal_1863_full.pdf")
    if os.path.exists(full_pdf):
        subprocess.run(["pdftoppm", "-png", "-f", "137", "-l", "137", "-r", "120", full_pdf, os.path.join(tmp, "buer")], check=True)
        buer_img = Image.open(os.path.join(tmp, "buer-137.png")).convert("L")
        buer_img = ImageOps.autocontrast(buer_img, cutoff=2).convert("RGB")
        bw, bh = buer_img.size
        buer_crop = buer_img.crop((int(bw * 0.49), int(bh * 0.564), int(bw * 0.91), int(bh * 0.86)))
        buer_crop.save(os.path.join(out_dir, "buer.jpg"), quality=82, optimize=True)
`;

execFileSync('python3',['-c',py],{stdio:'inherit'});
console.log('Extracted 68 plates into dist/plates/');

