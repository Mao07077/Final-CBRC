from database import users_collection

user = users_collection.find_one({"id_number": "123456"})
if user and "email" in user:
    print("Email:", user["email"])
else:
    print("Walang email na nahanap para sa user 123456")
