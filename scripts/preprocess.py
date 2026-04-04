import json
import re
import os
from collections import Counter

try:
    from tqdm import tqdm
except ImportError:

    def tqdm(iterable, *args, **kwargs):
        return iterable


SENTIMENT_AVAILABLE = True
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    sia = SentimentIntensityAnalyzer()
except ImportError:
    SENTIMENT_AVAILABLE = False
    print("Warning: vaderSentiment not installed. Install with: pip install vaderSentiment")

try:
    from langdetect import detect
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("Warning: langdetect not installed. Install with: pip install langdetect")

URL_REGEX = re.compile(r'https?://\S+')
HASHTAG_REGEX = re.compile(r'#\w+')


def extract_entities(text, remove_urls=True):
    """Extract URLs and hashtags from text, optionally removing URLs."""
    if not text:
        return [], [], text
    urls = URL_REGEX.findall(text)
    hashtags = HASHTAG_REGEX.findall(text)
    if remove_urls:
        text = URL_REGEX.sub('', text)
        text = re.sub(r'\s+', ' ', text).strip()
    return urls, hashtags, text


def detect_language(text):
    """Detect language of text using langdetect."""
    if not LANGDETECT_AVAILABLE or not text:
        return "en"
    try:
        return detect(text)
    except Exception:
        return "en"


def compute_sentiment(text):
    """Compute VADER sentiment scores."""
    if not SENTIMENT_AVAILABLE or not text:
        return {"compound": 0.0, "positive": 0.0, "neutral": 0.0, "negative": 0.0}
    scores = sia.polarity_scores(text)
    return scores


def preprocess_dataset(input_file="data.jsonl", output_file="data/cleaned_data.jsonl"):
    print(f"Preprocessing {input_file} -> {output_file}")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    valid_records = 0
    skipped_non_english = 0
    platform_counts = Counter()
    language_counts = Counter()

    with open(input_file, "r", encoding="utf-8") as fin, \
         open(output_file, "w", encoding="utf-8") as fout:

        for line in tqdm(fin, desc="Processing rows"):
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue

            record = {}
            if "data" in item:
                # Reddit Format
                d = item["data"]
                record["platform"] = "reddit"
                record["id"] = d.get("id", str(valid_records))
                record["author"] = d.get("author", "unknown_author")

                # Combine title and text
                title = d.get("title", "")
                selftext = d.get("selftext", "")
                full_text = f"{title}. {selftext}".strip()
                record["text"] = full_text

                record["created_utc"] = d.get("created_utc", 0)
                record["subreddit"] = d.get("subreddit", "unknown")
                record["score"] = d.get("score", 0)
                record["url"] = d.get("url", "")

            elif "text" in item and "author" in item:
                # Twitter Format
                record["platform"] = "twitter"
                record["id"] = item.get("id", str(valid_records))
                record["author"] = item.get("author", "unknown_author")
                record["text"] = item.get("text", "")
                record["created_utc"] = item.get("created_at", 0)
            else:
                # Skip unknown structures
                continue

            # Detect language
            lang = detect_language(record["text"])
            record["lang"] = lang
            language_counts[lang] += 1

            # Skip non-English posts (allow ~6 character language codes that might be edge cases)
            if LANGDETECT_AVAILABLE and lang != "en" and len(lang) <= 3:
                skipped_non_english += 1
                continue

            # Extract URLs and Hashtags, then remove URLs from clean text
            urls, hashtags, clean_text = extract_entities(record["text"], remove_urls=True)
            record["urls"] = urls
            record["hashtags"] = hashtags
            record["text"] = clean_text

            # Compute VADER sentiment for English posts
            sentiment = compute_sentiment(record["text"])
            record["sentiment"] = sentiment

            # Write to output if text exists
            if len(record["text"].strip()) > 5:
                fout.write(json.dumps(record) + "\n")
                valid_records += 1
                platform_counts[record["platform"]] += 1

    print(f"Finished. Extracted {valid_records} clean text entries.")
    if skipped_non_english:
        print(f"Skipped {skipped_non_english} non-English posts.")
    print(f"Platform distribution: {dict(platform_counts)}")
    if language_counts:
        print(f"Language distribution (top 10): {dict(language_counts.most_common(10))}")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_path = os.path.join(base_dir, "data.jsonl")
    output_path = os.path.join(base_dir, "data", "cleaned_data.jsonl")
    preprocess_dataset(input_file=input_path, output_file=output_path)
