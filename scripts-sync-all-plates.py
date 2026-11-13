import os
import sys
import json
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(ROOT, "dist/plates")
os.makedirs(OUT_DIR, exist_ok=True)

with open(os.path.join(ROOT, "resources/entries_1863_all.json")) as f:
    e_all = json.load(f)

with open(os.path.join(ROOT, "resources/entries_68_plates.json")) as f:
    p68 = json.load(f)

with open("/tmp/commons_resolved_images.json") as f:
    resolved = json.load(f)

# High-res mapping for original 68 plates
p68_highres = {
    'abigor': 'Abigor (DI).png',
    'abraxas': 'Abraxas.png',
    'adramelech': 'Adramelech (DI).png',
    'aguares': 'Aguarès.png',
    'alastor': 'Alastor (Dictionnaire Infernal).png',
    'alocer': 'Alocer 01.png',
    'amduscias': 'Amduscias (Dictionnaire infernal).png',
    'amon': 'Amon.png',
    'andras': 'Andras.png',
    'asmodee': 'Asmodaeus.png',
    'astaroth': 'Astaroth (DI).png',
    'azazel': 'Azazel (DI).png',
    'bael': 'Baël.png',
    'balan': 'Balan (Demon).png',
    'barbatos': 'Ill dict infernal p0093-79 barbatos.jpg',
    'behemoth': 'Ill dict infernal p0100-86 behemoth.jpg',
    'belphegor': 'Ill dict infernal p0103-89 belphegor.jpg',
    'belzebuth': 'Ill dict infernal p0103-89 belzebuth.jpg',
    'berith': 'Berith.png',
    'buer': 'Ill dict infernal p0139-123 buer.jpg',
    'caacrinolaas': 'Caacrinolaas.png',
    'cali': 'Ill dict infernal p0147-131 cali.jpg',
    'caym': 'Ill dict infernal p0163-147 caym 1.jpg',
    'cerbere': 'Ill dict infernal p0165-149 cerbere.jpg',
    'crapaud': 'Crapauds dansant au sabbat.png',
    'deumus': 'Deumus.png',
    'eurynome': 'Ill dict infernal p0270-254 eurynome demon.jpg',
    'flaga': 'Ill dict infernal p0291-275 flaga.jpg',
    'flauros': 'Ill dict infernal p0294-278 flauros demon.jpg',
    'forcas': 'Ill dict infernal p0296-280 forcas demon.jpg',
    'furfur': 'Ill dict infernal p0306-290 furfur demon.jpg',
    'ganga-gramma': 'Ill dict infernal p0312-296 ganga gramma demon.jpg',
    'garuda': 'Ill dict infernal p0313-297 garuda.png',
    'gomory': 'Ill dict infernal p0323-307 gomory demon.jpg',
    'haborym': 'Ill dict infernal p0333-317 haborym demon.jpg',
    'ipes': 'Ipès.png',
    'lamia': 'Ill dict infernal p0413.jpg',
    'lechies': 'Ill dict infernal p0419 lechies.jpg',
    'leonard': 'Ill dict infernal p0420 leonard.jpg',
    'lucifer': 'Ill dict infernal p0433 lucifer.jpg',
    'malphas': 'Ill dict infernal p0455 malphas.jpg',
    'mammon': 'Ill dict infernal p0455 mammon.jpg',
    'marchocias': 'Ill dict infernal p0461 marchocias.jpg',
    'melchom': 'Ill dict infernal p0469 melchom.jpg',
    'moloch': 'Ill dict infernal p0486 moloch.jpg',
    'mycale': 'Ill dict infernal p0500 mycale.jpg',
    'nickar': 'Nickar.png',
    'nybbas': 'Nybbas.png',
    'orobas': 'Orobas.png',
    'paymon': 'Ill dict infernal p0537 paymon.jpg',
    'picollus': 'Ill dict infernal p0555 picolus.jpg',
    'pruflas': 'Ill dict infernal p0578 pruflas.jpg',
    'rahouart': 'Ill dict infernal p0585 rahouart.jpg',
    'ribesal': 'Ill dict infernal p0598 rhibesal.jpg',
    'ronwe': 'Ill dict infernal p0600 ronwe.jpg',
    'sabbath': 'Danse du sabbat.png',
    'scox': 'Ill dict infernal p0617 scox.jpg',
    'stolas': 'Ill dict infernal p0651 stolas.jpg',
    'tap': 'Tap (démon).png',
    'torngarsuk': 'Torngarsuk.png',
    'transport-sorcerers': 'Transport des sorcières.png',
    'ukobach': 'Ukobach.png',
    'volac': 'Volac.png',
    'voyages-sorcerers': 'Voyages des sorcières.png',
    'wall': 'Wall (Dictionnaire infernal).png',
    'xaphan': 'Xaphan.png',
    'yan-gant-y-tan': 'Yan-gant-y-tan.png',
    'zaebos': 'Zaebos.png',
}

def norm(s):
    import re
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

tasks = {}
entry_plate_map = {}

# 1. 68 plates
for slug, commons_name in p68_highres.items():
    if commons_name in resolved and resolved[commons_name].get('url'):
        out_file = os.path.join(OUT_DIR, f"{slug}.jpg")
        tasks[out_file] = resolved[commons_name]['url']

# 2. Entries in e_all
for idx, e in enumerate(e_all):
    matched_p = None
    for p in p68:
        if p['id'] in e['nameFr'].lower() or p['nameFr'].split('(')[0].strip().lower() == e['nameFr'].lower():
            matched_p = p
            break
    if matched_p:
        entry_plate_map[idx] = f"plates/{matched_p['id']}.jpg"
        continue

    imgs = [img for img in e.get('images', []) if img in resolved and resolved[img].get('url') and not img.lower().endswith('.svg')]
    if imgs:
        best_img = imgs[0]
        slug_base = norm(e['nameFr'])[:28] or f"entry{idx+1}"
        file_name = f"e{idx+1}-{slug_base}.jpg"
        out_file = os.path.join(OUT_DIR, file_name)
        tasks[out_file] = resolved[best_img]['url']
        entry_plate_map[idx] = f"plates/{file_name}"

with open(os.path.join(ROOT, "resources/entry_plate_map.json"), "w") as f:
    json.dump({str(k): v for k, v in entry_plate_map.items()}, f, ensure_ascii=False, indent=2)

print(f"Total target plate files: {len(tasks)}", flush=True)
print(f"Total entries with plates: {len(entry_plate_map)}", flush=True)

USER_AGENT = "DictionnaireInfernalApp/1.0 (https://github.com/KimDomi/reading-calendar; contact@github.com)"

def process_file(out_file, url):
    # Check if already processed and high quality (> 45KB and modified recently)
    if os.path.exists(out_file) and os.path.getsize(out_file) > 45000:
        return (out_file, True, os.path.getsize(out_file), "skipped")

    tmp_file = out_file + ".tmp"
    downloaded = False
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
            with open(tmp_file, "wb") as f:
                f.write(data)
            downloaded = True
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 * (attempt + 1))
            else:
                time.sleep(1)
        except Exception:
            time.sleep(1.5)

    if not downloaded:
        return (out_file, False, 0, "download_failed")

    try:
        im = Image.open(tmp_file)
        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
            bg = Image.new('RGB', im.size, (255, 255, 255))
            im_rgb = im.convert('RGBA')
            bg.paste(im_rgb, mask=im_rgb.split()[3])
            im = bg
        else:
            im = im.convert('RGB')

        gray = ImageOps.grayscale(im)
        gray = ImageOps.autocontrast(gray, cutoff=1)
        final_im = gray.convert('RGB')

        max_dim = 1100
        w, h = final_im.size
        if max(w, h) > max_dim:
            if w > h:
                new_w = max_dim
                new_h = int(h * (max_dim / w))
            else:
                new_h = max_dim
                new_w = int(w * (max_dim / h))
            final_im = final_im.resize((new_w, new_h), Image.Resampling.LANCZOS)

        final_im.save(out_file, "JPEG", quality=88, optimize=True)
        return (out_file, True, os.path.getsize(out_file), "ok")
    except Exception as ex:
        return (out_file, False, 0, str(ex))
    finally:
        if os.path.exists(tmp_file):
            try: os.remove(tmp_file)
            except: pass

print("Syncing plates with 3 worker threads and polite rate limits...", flush=True)
done = 0
total = len(tasks)
total_bytes = 0

with ThreadPoolExecutor(max_workers=3) as executor:
    futures = {executor.submit(process_file, f, u): f for f, u in tasks.items()}
    for f in as_completed(futures):
        out_file, ok, sz, status = f.result()
        done += 1
        total_bytes += sz
        base = os.path.basename(out_file)
        if done % 20 == 0 or done == total:
            print(f"[{done}/{total}] {base:25} -> {status} ({sz//1024} KB, total {total_bytes//(1024*1024)} MB)", flush=True)

print(f"\nCompleted! Total plates: {done}, Total size: {total_bytes//(1024*1024)} MB", flush=True)
