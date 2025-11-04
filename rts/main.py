from gapp import GameApp
import logging

fmt = "%(asctime)s [%(levelname)s] %(filename)s:%(lineno)d: %(message)s"
logging.basicConfig(level=logging.DEBUG, filename="game.log", filemode="a", format=fmt, datefmt="%Y-%m-%d %H:%M:%S")

logging.info("Starting...")
app = GameApp()
if app.Init():
    app.run()