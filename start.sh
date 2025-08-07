#!/bin/bash

# Start the application
echo "🚀 Starting Spaceman Game..."

# Start the main application
npm run dev &

# Wait for the app to be ready
echo "⏳ Waiting for app to be ready..."
sleep 10

# Check if the app is responding
for i in {1..30}; do
  if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ App is ready!"
    break
  fi
  echo "⏳ Waiting for app to be ready... (attempt $i/30)"
  sleep 2
done

# Keep the script running
wait
