#!/bin/bash

echo "🔍 Checking Ollama models..."
echo ""

# Check what models are available
echo "Available models:"
ollama list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "You have llama3.1 but the service expects llama3.2:1b"
echo ""
echo "Choose an option:"
echo "  1) Update .env to use llama3.1 (Quick fix)"
echo "  2) Pull llama3.2:1b model (Recommended, ~700MB download)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Enter your choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "✏️  Updating .env to use llama3.1..."
    
    # Update the .env file
    if [ -f .env ]; then
        sed -i.bak 's/OLLAMA_MODEL=llama3.2:1b/OLLAMA_MODEL=llama3.1/' .env
        echo "✅ Updated .env file"
        echo ""
        echo "New OLLAMA_MODEL setting:"
        grep OLLAMA_MODEL .env
        echo ""
        echo "🔄 Please restart the agent service for changes to take effect:"
        echo "   pkill -f 'uvicorn main:app'"
        echo "   python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    else
        echo "❌ .env file not found"
    fi
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "📥 Pulling llama3.2:1b model..."
    echo "⏳ This will take a few minutes (model is ~700MB)..."
    echo ""
    
    ollama pull llama3.2:1b
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Model pulled successfully!"
        echo ""
        echo "🔄 Now restart the agent service:"
        echo "   pkill -f 'uvicorn main:app'"
        echo "   python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
    else
        echo ""
        echo "❌ Failed to pull model"
        echo "💡 Try option 1 instead to use llama3.1"
    fi
    
else
    echo ""
    echo "❌ Invalid choice. Please run the script again."
fi

echo ""


