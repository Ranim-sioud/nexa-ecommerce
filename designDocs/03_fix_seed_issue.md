### Sprint : Fix Seed Issue

# Current State
1. The Nexa-tn system is deployed successfully
2. Maybe the RBAC feature work (depend on users seed)


### Objective
1. generate a migration based on postgres sql dump (.sql not binary)
2. integrate the migration to the bootstrap of the Nexa-tn
3. fix the seed.js and integrate it at the bootstrap (ie: if data and tables exist ignore the action)
3.1 if possible squash all migration in one


## Given 
a backup sql dump in designDoc/scripts (as source for new migration)