# Testing the Upload Flow

This document explains how to verify that the frontend-backend upload flow is working correctly.

## Prerequisites

1. Backend running on `http://localhost:3001`
2. Frontend running on `http://localhost:5173`

## Quick Test with curl

### 1. Test Basic Connectivity

```bash
# Should return 404 or method not allowed (proves server is up)
curl -i http://localhost:3001/api/scene
```

### 2. Test Upload Endpoint

```bash
# Upload a test image
curl -i -X POST "http://localhost:3001/api/scene" \
  -H "x-request-id: req_CURLTEST001" \
  -F "image=@test-photo.jpg"
```

### 3. Expected Successful Response

```
HTTP/1.1 200 OK
Content-Type: application/json
...

{
  "version": 1,
  "image": { "w": 1280, "h": 720 },
  "objects": [...],
  "spawns": {
    "player": { "x": ..., "y": ... },
    "exit": { "x": ..., "y": ... },
    "enemies": [...],
    "pickups": [...]
  },
  "rules": [...]
}
```

## Verifying Backend Received Request

### Check Backend Logs

Look for log entries containing your `x-request-id`:

```
[INFO] request=req_CURLTEST001 received image size=245760
[INFO] request=req_CURLTEST001 processing started
[INFO] request=req_CURLTEST001 response sent status=200
```

### Verify Image Was Received

Backend should log:
- `file.mimetype`: Should be `image/jpeg` or similar
- `file.size`: Should match the file size you sent
- `file.buffer`: Should exist (if using memory storage)

## Verifying Response

### Status Code

| Code | Meaning |
|------|---------|
| 200 | Success - JSON body contains scene data |
| 400 | Bad Request - missing image or invalid format |
| 500 | Server Error - check backend logs |

### JSON Structure

Verify the response contains required fields:

```bash
# Parse and validate with jq (if installed)
curl -s -X POST "http://localhost:3001/api/scene" \
  -H "x-request-id: req_TEST" \
  -F "image=@test.jpg" | jq '.version, .spawns.player'
```

## Testing from Frontend

### 1. Open Browser DevTools

- Network tab: Watch for POST request to `/api/scene`
- Console tab: Watch for log messages with `requestId`

### 2. Capture and Upload

1. Take a photo or select an image
2. Click "Upload & Generate"
3. Watch Network tab for the request

### 3. Check Request Details

In Network tab, verify:
- Request Method: `POST`
- Request URL: `http://localhost:3001/api/scene`
- Request Headers: `x-request-id` should be present
- Form Data: `image` field with the file

### 4. Check Response

- Status: 200
- Response body: Valid Scene JSON

## Common Issues

### CORS Error

**Symptom**: Console shows "blocked by CORS policy"

**Fix**: Backend needs CORS headers:
```typescript
app.use(cors({ origin: 'http://localhost:5173' }));
```

### 404 Not Found

**Symptom**: Status 404 on POST

**Fix**: Check backend route is correctly defined:
```typescript
app.post('/api/scene', ...)  // Note: POST, not GET
```

### Empty Response

**Symptom**: 200 status but empty body

**Fix**: Backend must call `res.json(...)` with data

### File Not Received

**Symptom**: `req.file` is undefined

**Fix**: Check multer middleware is applied:
```typescript
app.post('/api/scene', upload.single('image'), ...)
```

## Test Scenarios

### Happy Path
1. Select valid image
2. Upload succeeds
3. See success screen with JSON summary

### Network Error
1. Stop backend server
2. Try upload
3. Should see error screen with retry option

### Invalid Image
1. Backend returns 400
2. Should see error screen with message

### Demo Mode
1. Enable "Demo Random" in dev panel
2. Disable "Force Success"
3. Upload multiple times
4. Should randomly see success/error (50/50)

## Debugging Tips

1. **Match request IDs**: Frontend and backend logs should show the same `requestId`
2. **Check file size**: Frontend compresses images; backend should receive ~100-300KB
3. **Verify JSON structure**: Use a JSON validator if response seems malformed
4. **Test with a known good image**: Use a simple JPEG file to rule out image issues
