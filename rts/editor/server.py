from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import uvicorn
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware, 
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

@app.get("/get_map/{mapid}")
def getMap(mapid):
    fname = f"../json/maps/{mapid}.json"
    if not os.path.exists(fname):
        return "fail"
    f = open(fname, 'r')
    return json.load(f)

@app.post("/save_map")
def saveMap(mapid=Body(None), data=Body(None)):
    json.dump(data, open(f"../json/maps/{mapid}.json", 'w'))
    return 'success'

@app.get("/get_map_list")
def getMapList():
    files = os.listdir("../json/maps/")
    names = []
    for f in files:
        names.append(f[:-5])
    return {"files":names}

if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=5678)