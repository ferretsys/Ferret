import random

charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
def char():
    nextChar = charset[random.randint(0, len(charset)-1)]
    return nextChar

result = ""
for i in range(50):
    result += char()
print("TOKEN:")
print(result)