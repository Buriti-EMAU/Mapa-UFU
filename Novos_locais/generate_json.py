import os
import json

def generate_json(root_dir="novos"):
    data = []
    for location_dir in os.listdir(root_dir):
        print(location_dir)
        location_path = os.path.join(root_dir, location_dir)
        if os.path.isdir(location_path):
            print(location_path)
            location_data = {
                "name": "",
                "evaluation": "",
                "category": "",
                "latitude": "",
                "longitude": "",
                "description": "",
                "images": []
            }

            # Find and read data from any .txt file in the directory
            text_file_path = None
            for file_in_dir in os.listdir(location_path):
                if file_in_dir.lower().endswith(".txt"):
                    text_file_path = os.path.join(location_path, file_in_dir)
                    print(f"Found text file: {text_file_path}")
                    break # Use the first .txt file found

            if text_file_path: # Check if a .txt file was found
                if os.path.exists(text_file_path):
                    try:
                        with open(text_file_path, "r", encoding="utf-8") as f:
                            # Read the text file and extract data
                            lines = f.readlines()
                            print(lines)
                            location_data["name"] = lines[0].strip() if len(lines) > 0 else ""
                            print(location_data["name"])
                            location_data["id"] = location_data["name"] if location_data["name"] else location_dir # Fallback id to dir name
                            location_data["evaluation"] = lines[1].strip() if len(lines) > 1 else ""
                            location_data["latitude"] = lines[2].strip() if len(lines) > 2 else ""
                            location_data["longitude"] = lines[3].strip() if len(lines) > 3 else ""
                            location_data["category"] = lines[4].strip() if len(lines) > 4 else ""
                            location_data["description"] = "<br />".join(line.strip() for line in lines[5:]).strip() if len(lines) > 5 else ""
                    except Exception as e:
                        print(f"Error reading {text_file_path}: {e}")
            else:
                print(f"No .txt file found in {location_path}")
                location_data["id"] = location_dir # Ensure id is set even if no txt file

            # Collect image files
            for filename in os.listdir(location_path):
                if filename.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp")):
                    image_path = os.path.join(location_dir, filename)
                    location_data["images"].append(image_path.replace("\\", "/"))

            data.append(location_data)

    # Create the JSON file
    output_file = "novos_json.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    return output_file

if __name__ == "__main__":
    output_file = generate_json()
    print(f"JSON file created: {output_file}")