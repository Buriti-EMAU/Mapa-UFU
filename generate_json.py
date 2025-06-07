import os
import json

def generate_json(root_dir="Arquivos_brutos"):
    data = []
    for location_dir in os.listdir(root_dir):
        location_path = os.path.join(root_dir, location_dir)
        if os.path.isdir(location_path):
            location_data = {
                "name": "",
                "classification": "",
                "category": "",
                "latitude": "",
                "longitude": "",
                "description": "",
                "images": []
            }

            # Read data from the text file
            text_file_path = os.path.join(location_path, f"{location_dir}.txt")
            if os.path.exists(text_file_path):
                try:
                    with open(text_file_path, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        location_data["name"] = lines[0].strip() if len(lines) > 0 else ""
                        location_data["classification"] = lines[1].strip() if len(lines) > 1 else ""
                        location_data["category"] = lines[2].strip() if len(lines) > 2 else ""
                        location_data["latitude"] = lines[3].strip() if len(lines) > 3 else ""
                        location_data["longitude"] = lines[4].strip() if len(lines) > 4 else ""
                        location_data["description"] = lines[5].strip() if len(lines) > 5 else ""
                except Exception as e:
                    print(f"Error reading {text_file_path}: {e}")

            # Collect image files
            for filename in os.listdir(location_path):
                if filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif")):
                    location_data["images"].append(filename)

            data.append(location_data)

    # Create the JSON file
    output_file = "locations.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    return output_file

if __name__ == "__main__":
    output_file = generate_json()
    print(f"JSON file created: {output_file}")