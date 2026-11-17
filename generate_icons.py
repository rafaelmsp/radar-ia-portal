from PIL import Image, ImageDraw
from pathlib import Path
folder = Path(__file__).parent / "public"
folder.mkdir(exist_ok=True)
for size, name in [(192,"pwa-192.png"),(512,"pwa-512.png"),(180,"apple-touch-icon.png")]:
    image=Image.new("RGB",(size,size),(8,28,48))
    draw=ImageDraw.Draw(image)
    c=size/2
    for frac in (0.33,0.23,0.10):
        r=size*frac
        draw.ellipse((c-r,c-r,c+r,c+r),outline=(85,202,247),width=max(3,size//45))
    draw.line((c,c,c+size*.24,c-size*.2),fill=(178,249,255),width=max(5,size//28))
    r=size*.05
    draw.ellipse((c-r,c-r,c+r,c+r),fill=(240,253,255))
    image.save(folder/name)
print("PNG icons created")
