// MongoDB initialization script
// This script will be executed when the MongoDB container starts for the first time

db = db.getSiblingDB('cbrc');

// Create collections
db.createCollection('users');
db.createCollection('messages');
db.createCollection('study_groups');
db.createCollection('notes');
db.createCollection('modules');
db.createCollection('flashcards');
db.createCollection('schedules');

// Create indexes for better performance
db.users.createIndex({ "id_number": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.messages.createIndex({ "sender_id": 1 });
db.messages.createIndex({ "receiver_id": 1 });
db.messages.createIndex({ "timestamp": 1 });
db.messages.createIndex({ "sender_id": 1, "receiver_id": 1 });

db.study_groups.createIndex({ "room_id": 1 }, { unique: true });
db.study_groups.createIndex({ "participants": 1 });

db.notes.createIndex({ "user_id": 1 });
db.notes.createIndex({ "module_id": 1 });

db.modules.createIndex({ "code": 1 });

db.flashcards.createIndex({ "user_id": 1 });
db.flashcards.createIndex({ "deck_name": 1 });

db.schedules.createIndex({ "user_id": 1 });
db.schedules.createIndex({ "date": 1 });

print('Database initialization completed');
