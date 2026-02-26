def generate_explanation(
    rule_violations: list,
    similarity: dict | None,
) -> str:
    def _clean(msg):
        return str(msg).rstrip(" .")

    if rule_violations:
        violation = rule_violations[0]
        vtype = _clean(violation.get("type", "UNKNOWN"))
        details = _clean(violation.get("message", "No additional details."))
        return (
            f"The submitted title was rejected due to regulatory rule violation: "
            f"{vtype}. "
            f"Details: {details}."
        )

    if similarity:
        best_match = similarity.get("best_match")
        scores = similarity.get("scores", {})
        severity = similarity.get("severity")
        probability = similarity.get("verification_probability")

        lexical = round(scores.get("lexical", 0), 2)
        phonetic = round(scores.get("phonetic", 0), 2)
        semantic = round(scores.get("semantic", 0), 2)
        final = round(scores.get("final", 0), 2)

        return (
            f"The submitted title shows {severity} similarity to "
            f"'{best_match}' with a composite score of {final}%. "
            f"This is influenced by lexical similarity ({lexical}%), "
            f"phonetic similarity ({phonetic}%), and semantic alignment ({semantic}%). "
            f"The estimated probability of approval is {round(probability, 2)}%."
        )

    return "No issues detected."
