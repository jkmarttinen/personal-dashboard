import json
import os

def assemble():
    base_dir = '/home/jani/Desktop/personal-dashboard'
    public_dir = os.path.join(base_dir, 'public')
    
    with open(os.path.join(public_dir, 'index.html'), 'r', encoding='utf-8') as f:
        html = f.read()
        
    with open(os.path.join(public_dir, 'style.css'), 'r', encoding='utf-8') as f:
        css = f.read()
        
    with open(os.path.join(base_dir, 'static_data.json'), 'r', encoding='utf-8') as f:
        data = f.read()
        # Ensure it's valid JSON but keep as string for embedding
        # verify
        json.loads(data)
        
    with open(os.path.join(public_dir, 'app_static.js'), 'r', encoding='utf-8') as f:
        js = f.read()
        
    # Inject CSS
    html = html.replace('<link rel="stylesheet" href="style.css?v=8">', f'<style>{css}</style>')
    
    # Inject JS and Data
    # Removing the old script tag
    html = html.replace('<script src="app.js?v=8"></script>', '')
    
    # Adding new script block
    script_block = f"""
    <script>
    const embeddedData = {data};
    
    {js}
    </script>
    """
    
    html = html.replace('</body>', f'{script_block}</body>')
    
    output_path = os.path.join(base_dir, 'dashboard.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"Created {output_path}")

if __name__ == '__main__':
    assemble()
