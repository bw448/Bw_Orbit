# -*- coding: utf-8 -*-
"""Merge OCR-extracted 遥感导论 appendix 3/4 into assets/rs-appendix-data.js.

Source files live in .work/appendix (not committed); the generated data file is.
The appendix is image-only in the PDF, so this script also applies a small
hand-checked fix list for entries the OCR could not read.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, ".work", "appendix")
OUT = os.path.join(ROOT, "assets", "rs-appendix-data.js")

FIX_A3 = {
    "ACE": {"zh": "姿态控制电子设备"},
    "HCMM": {"en": "Heat Capacity Mapping Mission"},
    "HCMR": {"en": "Heat Capacity Mapping Radiometer"},
    "HDDT": {"en": "High Density Digital Tape"},
    "HEAO": {"en": "High Energy Astronomy Observatory"},
    "HRIRS": {"zh": "高分辨率红外辐射探测仪"},
    "ACR": {"zh": "主动型谐振腔式辐射计"},
    "ALARM": {"zh": "机载激光雷达"},
}
FIX_A4 = {
    "analog-to-digital conversion(A/D)": {"zh": "模-数转换"},
    "CCTATM tape": {"en": "CCT tape", "zh": "计算机兼容磁带"},
    "Geostationary meteorological satellite(GNS)": {"en": "Geostationary meteorological satellite (GMS)", "zh": "日本同步气象卫星"},
    "landscape ecosystem": {"zh": "景观生态系统"},
}


def load(name):
    with open(os.path.join(WORK, name), encoding="utf-8") as f:
        return json.load(f)


def clean(items, kind):
    seen = set()
    out = []
    for x in items:
        if kind == "a3":
            abbr = (x.get("abbr") or "").strip()
            abbr = abbr.split(";")[0].strip()  # "AFC; afc" -> "AFC"
            rec = {
                "abbr": abbr,
                "en": (x.get("en") or "").strip(),
                "zh": (x.get("zh") or "").strip(),
                "page": x.get("page"),
            }
            fix = FIX_A3.get(rec["abbr"], {})
            rec.update(fix)
            if not rec["en"] and not rec["zh"]:
                continue
            key = (rec["abbr"].lower(), rec["en"].lower(), rec["zh"])
        else:
            rec = {
                "en": (x.get("en") or "").strip(),
                "zh": (x.get("zh") or "").strip(),
                "page": x.get("page"),
            }
            if not rec["en"] or not rec["zh"]:
                continue
            rec.update(FIX_A4.get(rec["en"], {}))
            key = (rec["en"].lower(), rec["zh"])
        if key in seen:
            continue
        seen.add(key)
        out.append(rec)
    return out


def main():
    a3 = clean(load("app3.json"), "a3")
    a4 = clean(load("app4a.json") + load("app4b.json"), "a4")
    a4.sort(key=lambda x: (x["page"], x["en"].lower()))
    for i, rec in enumerate(a3, 1):
        rec["id"] = "a3-%03d" % i
    for i, rec in enumerate(a4, 1):
        rec["id"] = "a4-%04d" % i
    data = {
        "meta": {
            "source": "《遥感导论》（梅安新等）附录 3、附录 4",
            "app3": len(a3),
            "app4": len(a4),
            "note": "据教材附录页序整理；OCR 可能有少量识别误差，以书上原文为准。",
        },
        "app3": a3,
        "app4": a4,
    }
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* Orbit · 遥感导论附录 3/4（教材扫描 OCR + 人工校对） */\n")
        f.write("window.RS_APPENDIX = ")
        f.write(body)
        f.write(";\n")
    print("wrote", OUT, len(a3), "app3 +", len(a4), "app4 =", len(a3) + len(a4))


if __name__ == "__main__":
    main()
