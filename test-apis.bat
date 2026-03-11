@echo off
echo Testing Solara API Endpoints...
echo.

echo 1. Testing GET /api/leads...
curl -s http://localhost:3000/api/leads
echo.
echo.

echo 2. Testing GET /api/quotes...
curl -s http://localhost:3000/api/quotes
echo.
echo.

echo 3. Testing GET /api/stats...
curl -s http://localhost:3000/api/stats
echo.
echo.

echo 4. Testing POST /api/auth/login...
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@solara2026.dz\",\"password\":\"admin123\"}"
echo.
echo.

echo 5. Testing POST /api/quote (homepage form)...
curl -s -X POST http://localhost:3000/api/quote -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"projectType\":\"residential\",\"phone\":\"0555123456\",\"comment\":\"Test comment\"}"
echo.
echo.

echo 6. Testing POST /api/leads...
curl -s -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d "{\"name\":\"New Lead\",\"email\":\"newlead@test.com\",\"phone\":\"0555000000\",\"status\":\"new\"}"
echo.
echo.

echo All tests completed!
pause

