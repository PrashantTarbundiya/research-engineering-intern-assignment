import json
import sys

def inspect_dataset(filepath="data.jsonl", max_lines=1000):
    print(f"Inspecting first {max_lines} lines of {filepath}...")
    platforms = set()
    sample_twitter = None
    sample_reddit = None

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if i >= max_lines:
                    break
                
                item = json.loads(line)
                
                # Check structure
                if "data" in item:
                    # Reddit format typical
                    platforms.add("reddit")
                    if sample_reddit is None:
                        sample_reddit = list(item["data"].keys())
                elif "text" in item and "author" in item:
                    # Twitter format typical
                    platforms.add("twitter")
                    if sample_twitter is None:
                        sample_twitter = list(item.keys())
                else:
                    platforms.add("unknown")
        
        print(f"\nDiscovered Platforms: {platforms}")
        if sample_reddit:
            print(f"Reddit Keys Example: {sample_reddit[:10]}")
        if sample_twitter:
            print(f"Twitter Keys Example: {sample_twitter[:10]}")
            
    except FileNotFoundError:
        print(f"Error: Could not find {filepath}. Ensure you have the dataset.")
        sys.exit(1)

if __name__ == "__main__":
    inspect_dataset()
