@echo off
echo Generating Prisma client...
npx prisma generate

echo Applying database migrations...
npx prisma migrate dev --name add_lastActive_to_user

echo Done!
pause