# -*- coding: utf-8 -*-
"""Classify the 599 Python questions into the guide's knowledge modules.

The 599-question bank is fixed; this only produces auxiliary counts for
python-guide.html. Run: python tools/build_python_topics.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src", "python_questions.json")
OUT = os.path.join(ROOT, "src", "python_topics.json")

RULES = [
    ("gdal", r"gdal|ogr|栅格|波段|geotransform|raster|readasarray|投影变换|重采样"),
    ("geopandas", r"geopandas|gpd\b|geodataframe|read_file|to_crs|\.shp|overlay|dissolve|sjoin|geometry|\bcrs\b"),
    ("matplotlib", r"matplotlib|plt\.|figure|subplot|scatter|legend|xlabel|ylabel|savefig|柱状图|折线图|散点图"),
    ("pandas", r"pandas|dataframe|series|iloc|\bloc\b|groupby|merge|concat|read_csv|read_excel|dropna|fillna|qcut|cut\(|rolling|pivot|value_counts|nunique"),
    ("oop2", r"继承|多态|重写|super\(|mro|鸭子类型|模块导入|from .* import|\bimport\b|__all__"),
    ("oop1", r"__init__|\bself\b|实例|类的|定义类|创建一个类|类属性|类方法|静态方法|封装|魔术方法|构造方法|__str__|__repr__|@property|classmethod|staticmethod|面向对象"),
    ("decorator", r"装饰器|生成器|迭代器|yield|__iter__|__next__"),
    ("functions", r"函数|参数|作用域|闭包|global|nonlocal|lambda|递归|延迟绑定"),
    ("containers", r"列表|字典|元组|集合|推导式|切片|解包|append|extend|sorted|sort\(|dict\(|list\(|tuple\(|set\("),
    ("env", r"模块|包|import|pathlib|文件|异常|try|except|conda|jupyter|路径|open\("),
    ("basics", r"print|input|变量|数据类型|字符串|运算符|range|int\(|float\(|bool|格式化|f-string|if |for |while "),
]
COMP = [(k, re.compile(p, re.I)) for k, p in RULES]


def classify(q):
    text = q["q"] + " " + q.get("e", "") + " " + " ".join(q.get("options") or [])
    for key, rx in COMP:
        if rx.search(text):
            return key
    return "other"


def main():
    qs = json.load(open(SRC, encoding="utf-8"))
    counts, samples, papers, ids = {}, {}, {}, {}
    for q in qs:
        key = classify(q)
        counts[key] = counts.get(key, 0) + 1
        ids.setdefault(key, []).append(q["id"])
        samples.setdefault(key, [])
        if len(samples[key]) < 4:
            samples[key].append({"id": q["id"], "paper": q["paper"], "q": q["q"][:80]})
        papers.setdefault(key, {})
        papers[key][q["paper"]] = papers[key].get(q["paper"], 0) + 1

    data = {
        "total": len(qs),
        "counts": counts,
        "samples": samples,
        "papers": papers,
        "ids": ids,
        "note": "按题干、选项与解析中的关键词自动归类，仅用于复习导航；一题只计一次。",
    }
    json.dump(data, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("classified", len(qs), counts)
    print("written", OUT)


if __name__ == "__main__":
    main()
