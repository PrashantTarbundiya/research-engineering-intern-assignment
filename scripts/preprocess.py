import json
import re
import os

try:
    from tqdm import tqdm
except ImportError:

    def tqdm(iterable, *args, **kwargs):
        return iterable

URL_REGEX = re.compile(r'https?://\S+')
HASHTAG_REGEX = re.compile(r'#\w+')

def extract_entities(text):
    if not text:
        return [], []
    urls = URL_REGEX.findall(text)
    hashtags = HASHTAG_REGEX.findall(text)
    return urls, hashtags

def preprocess_dataset(input_file="data.jsonl", output_file="data/cleaned_data.jsonl"):
    print(f"Preprocessing {input_file} -> {output_file}")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    valid_records = 0
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
                
            elif "text" in item and "author" in item:
                # Twitter Format
                record["platform"] = "twitter"
                record["id"] = item.get("id", str(valid_records))
                record["author"] = item.get("author", "unknown_author")
                record["text"] = item.get("text", "")
                record["created_utc"] = item.get("created_at", 0) # Adjust field if needed
            else:
                # Skip unknown structures
                continue
            
            # Extract URLs and Hashtags for Network/Graph analysis later
            urls, hashtags = extract_entities(record["text"])
            record["urls"] = urls
            record["hashtags"] = hashtags
            
            # Write to output if text exists
            if len(record["text"].strip()) > 5:
                fout.write(json.dumps(record) + "\n")
                valid_records += 1

    print(f"Finished. Extracted {valid_records} clean text entries.")

if __name__ == "__main__":
    preprocess_dataset()
