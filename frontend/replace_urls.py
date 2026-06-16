import os

def replace_urls():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                fpath = os.path.join(root, file)
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if '127.0.0.1:8000' in content:
                    new_content = content.replace(
                        'http://127.0.0.1:8000', 
                        "${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}"
                    )
                    with open(fpath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {fpath}")

if __name__ == '__main__':
    replace_urls()
