try:
    import jellyfish
except ModuleNotFoundError:
    jellyfish = None


def compute_phonetic(text: str) -> str:
    if not text:
        return ""

    if jellyfish is not None:
        return jellyfish.metaphone(text)

    # Fallback when jellyfish is unavailable in the environment.
    return _soundex(text)


def _soundex(text: str) -> str:
    text = "".join(ch for ch in text.upper() if ch.isalpha())
    if not text:
        return ""

    mapping = {
        **dict.fromkeys(list("BFPV"), "1"),
        **dict.fromkeys(list("CGJKQSXZ"), "2"),
        **dict.fromkeys(list("DT"), "3"),
        **dict.fromkeys(list("L"), "4"),
        **dict.fromkeys(list("MN"), "5"),
        **dict.fromkeys(list("R"), "6"),
    }
    first = text[0]
    digits = [mapping.get(c, "0") for c in text[1:]]

    reduced = []
    prev = mapping.get(first, "0")
    for d in digits:
        if d != prev:
            reduced.append(d)
        prev = d
    code = "".join(d for d in reduced if d != "0")
    return (first + code + "000")[:4]
