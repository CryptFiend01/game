class TimerMgr:
    def __init__(self) -> None:
        self.tsec = 0

    def update(self):
        self.tsec += 1

    def getTick(self):
        return self.tsec