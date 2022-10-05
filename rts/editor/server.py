from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import uvicorn

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
    f = open(f"../json/maps/{mapid}.json", 'r')
    return json.load(f)

@app.post("/save_map")
def saveMap(mapid=Body(None), data=Body(None)):
    json.dump(data, open(f"../json/maps/{mapid}.json", 'w'))
    return 'success'

if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=5678)