import os

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return False
    
    new_content = content.replace('intellipath', 'webar')
    new_content = new_content.replace('Intellipath', 'WeBAR')
    new_content = new_content.replace('INTELLIPATH', 'WEBAR')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")
        return True
    return False

def walk_dir(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if '.dist' in dirs:
            dirs.remove('.dist')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            if file.endswith('.json') or file.endswith('.js') or file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.html') or file.endswith('.md') or file.endswith('.cjs') or file.endswith('.jsonc'):
                replace_in_file(os.path.join(root, file))

if __name__ == "__main__":
    base_dir = r"c:\Users\makin\Desktop\intellipath"
    walk_dir(os.path.join(base_dir, "frontend"))
    walk_dir(os.path.join(base_dir, "server"))
    print("Done")
