#!/usr/bin/env python3
"""
Script to fix role case sensitivity issues in the database
"""

import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Add the backend directory to the path so we can import the config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

def fix_user_roles():
    """Fix role case sensitivity in the database"""
    try:
        # Get MongoDB connection details
        mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://Admin:CBRCLP@cluster0.xjrey3k.mongodb.net/")
        database_name = os.getenv("DATABASE_NAME", "cbrc")
        
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client[database_name]
        users_collection = db["userinfo"]
        
        print("Checking and fixing user roles...")
        
        # Find users with incorrect role casing
        incorrect_roles = {
            "Student": "student",
            "Instructor": "instructor", 
            "Admin": "admin"
        }
        
        total_fixed = 0
        
        for old_role, new_role in incorrect_roles.items():
            # Find users with the old role format
            users_with_old_role = users_collection.find({"role": old_role})
            count = 0
            
            for user in users_with_old_role:
                # Update the role to lowercase
                result = users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"role": new_role}}
                )
                if result.modified_count > 0:
                    count += 1
                    print(f"Fixed role for user {user.get('id_number', 'unknown')}: {old_role} -> {new_role}")
            
            total_fixed += count
            if count > 0:
                print(f"Fixed {count} users with role '{old_role}'")
        
        if total_fixed == 0:
            print("No role fixes needed - all roles are already in correct format")
        else:
            print(f"\nTotal users fixed: {total_fixed}")
        
        # Show current role distribution
        print("\nCurrent role distribution:")
        for role in ["student", "instructor", "admin"]:
            count = users_collection.count_documents({"role": role})
            print(f"  {role}: {count} users")
        
        # Show any remaining non-standard roles
        all_roles = users_collection.distinct("role")
        standard_roles = {"student", "instructor", "admin"}
        non_standard = [role for role in all_roles if role not in standard_roles]
        
        if non_standard:
            print(f"\nWarning: Found non-standard roles: {non_standard}")
        
        client.close()
        print("\nRole fix completed successfully!")
        
    except Exception as e:
        print(f"Error fixing roles: {e}")
        return False
    
    return True

def create_test_instructor():
    """Create a test instructor account for testing"""
    try:
        # Get MongoDB connection details
        mongo_uri = os.getenv("MONGO_URI", "mongodb+srv://Admin:CBRCLP@cluster0.xjrey3k.mongodb.net/")
        database_name = os.getenv("DATABASE_NAME", "cbrc")
        
        # Connect to MongoDB
        client = MongoClient(mongo_uri)
        db = client[database_name]
        users_collection = db["userinfo"]
        
        # Check if test instructor already exists
        test_instructor = users_collection.find_one({"id_number": "12345"})
        
        if test_instructor:
            print("Test instructor (ID: 12345) already exists")
            # Just fix the role if needed
            if test_instructor.get("role") != "instructor":
                users_collection.update_one(
                    {"id_number": "12345"},
                    {"$set": {"role": "instructor"}}
                )
                print("Updated test instructor role to 'instructor'")
        else:
            # Create test instructor account
            from utils import hash_password
            
            test_instructor_data = {
                "id_number": "12345",
                "firstname": "Test",
                "lastname": "Instructor", 
                "email": "instructor@test.com",
                "password": hash_password("password123"),
                "role": "instructor",
                "gender": "Male",
                "contact_number": "09123456789",
                "hoursActivity": 0,
                "surveyCompleted": True,
                "notes": []
            }
            
            users_collection.insert_one(test_instructor_data)
            print("Created test instructor account:")
            print("  ID Number: 12345")
            print("  Password: password123")
            print("  Role: instructor")
        
        client.close()
        
    except Exception as e:
        print(f"Error creating test instructor: {e}")

if __name__ == "__main__":
    print("Database Role Fix Script")
    print("=" * 30)
    
    # First fix existing roles
    if fix_user_roles():
        print("\n" + "=" * 30)
        # Then create test instructor if needed
        create_test_instructor()
