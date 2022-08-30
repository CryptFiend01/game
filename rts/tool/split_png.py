from PIL import Image

img = Image.open("../Assets/Characters/PHC_CiviliansA.png")
w, h = img.size
sp = img.crop((0, 0, w / 12, h / 8))
sp.show()