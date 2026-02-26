import os

from sentence_transformers import SentenceTransformer

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"
MODEL_CACHE_DIR = "./model_cache"

_model = None


def load_model():
    global _model

    if _model is not None:
        return _model

    os.makedirs(MODEL_CACHE_DIR, exist_ok=True)

    try:
        _model = SentenceTransformer(
            MODEL_NAME,
            cache_folder=MODEL_CACHE_DIR,
        )
        print("Semantic model loaded successfully.")
    except Exception as exc:  # noqa: BLE001
        print(f"Primary model load failed: {exc}")
        try:
            _model = SentenceTransformer(
                MODEL_NAME,
                cache_folder=MODEL_CACHE_DIR,
                local_files_only=True,
            )
            print("Semantic model loaded from local cache.")
        except Exception as local_exc:  # noqa: BLE001
            print(f"Failed to load semantic model: {local_exc}")
            _model = None

    return _model


def get_model():
    return _model
