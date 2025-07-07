# backend_test.py - Simple test script to check if your API is working
# Location: same folder as main.py

import requests
import json

def test_backend_api():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing TradeSync Backend API")
    print("=" * 40)
    
    # Test 1: Root endpoint
    try:
        print("1. Testing root endpoint...")
        response = requests.get(f"{base_url}/")
        if response.status_code == 200:
            print("   ✅ Root endpoint working")
            print(f"   📊 Response: {response.json()['message']}")
        else:
            print(f"   ❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Root endpoint error: {e}")
    
    # Test 2: Health check
    try:
        print("\n2. Testing health endpoint...")
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Health check working")
            print(f"   📊 Database: {data.get('database', 'unknown')}")
            print(f"   📊 Total trades: {data.get('total_trades', 0)}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
    
    # Test 3: Trades endpoint
    try:
        print("\n3. Testing trades endpoint...")
        response = requests.get(f"{base_url}/trades/")
        if response.status_code == 200:
            trades = response.json()
            print(f"   ✅ Trades endpoint working ({len(trades)} trades found)")
        else:
            print(f"   ❌ Trades endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Trades endpoint error: {e}")
    
    # Test 4: Accounts endpoint
    try:
        print("\n4. Testing accounts endpoint...")
        response = requests.get(f"{base_url}/accounts/")
        if response.status_code == 200:
            accounts = response.json()
            print(f"   ✅ Accounts endpoint working ({len(accounts)} accounts found)")
        else:
            print(f"   ❌ Accounts endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Accounts endpoint error: {e}")
    
    # Test 5: API status endpoint
    try:
        print("\n5. Testing API status endpoint...")
        response = requests.get(f"{base_url}/api/status")
        if response.status_code == 200:
            print("   ✅ API status endpoint working")
        else:
            print(f"   ❌ API status failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ API status error: {e}")
    
    print("\n" + "=" * 40)
    print("🎯 Backend API test completed!")
    print("\nNext steps:")
    print("1. If all tests pass ✅ - your backend is working correctly")
    print("2. If tests fail ❌ - check the error messages above")
    print("3. Make sure your server is running: python main.py")

if __name__ == "__main__":
    test_backend_api()