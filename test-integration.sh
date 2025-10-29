#!/bin/bash

# CloudPOS Integration Testing Script
# This script performs comprehensive testing of all CloudPOS services

set -e  # Exit on any error

echo "🚀 CloudPOS Integration Testing Suite"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:3000"
AUTH_SERVICE_URL="http://localhost:3001"
INVENTORY_SERVICE_URL="http://localhost:3002"
TRANSACTION_SERVICE_URL="http://localhost:3003"
PAYMENT_SERVICE_URL="http://localhost:3004"
CUSTOMER_SERVICE_URL="http://localhost:3005"
NOTIFICATION_SERVICE_URL="http://localhost:3006"
REPORTING_SERVICE_URL="http://localhost:3007"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $message"
        ((PASSED_TESTS++))
    elif [ "$status" == "FAIL" ]; then
        echo -e "${RED}✗ FAIL${NC} - $message"
        ((FAILED_TESTS++))
    elif [ "$status" == "INFO" ]; then
        echo -e "${BLUE}ℹ INFO${NC} - $message"
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠ WARN${NC} - $message"
    fi
    
    ((TOTAL_TESTS++))
}

# Test service health
test_service_health() {
    local service_name=$1
    local service_url=$2
    
    echo -e "\n${BLUE}Testing $service_name health...${NC}"
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$service_url/health" 2>/dev/null || echo "000")
    
    if [ "$response" == "200" ]; then
        print_status "PASS" "$service_name is healthy"
    else
        print_status "FAIL" "$service_name health check failed (HTTP $response)"
        return 1
    fi
}

# Test authentication flow
test_authentication() {
    echo -e "\n${BLUE}Testing Authentication Flow...${NC}"
    
    # Test login with valid credentials
    login_response=$(curl -s -X POST "$AUTH_SERVICE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"admin@cloudpos.com","password":"admin123"}' 2>/dev/null)
    
    if echo "$login_response" | grep -q "token"; then
        print_status "PASS" "User login successful"
        # Extract token for subsequent tests
        ACCESS_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        export ACCESS_TOKEN
    else
        print_status "FAIL" "User login failed"
        return 1
    fi
    
    # Test token verification
    verify_response=$(curl -s -X POST "$AUTH_SERVICE_URL/auth/verify" \
        -H "Content-Type: application/json" \
        -d "{\"token\":\"$ACCESS_TOKEN\"}" 2>/dev/null)
    
    if echo "$verify_response" | grep -q "valid"; then
        print_status "PASS" "Token verification successful"
    else
        print_status "FAIL" "Token verification failed"
    fi
}

# Test inventory operations
test_inventory_operations() {
    echo -e "\n${BLUE}Testing Inventory Operations...${NC}"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_status "FAIL" "No access token available for inventory tests"
        return 1
    fi
    
    # Test product listing
    products_response=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$INVENTORY_SERVICE_URL/api/products" 2>/dev/null)
    
    if echo "$products_response" | grep -q "products\|items"; then
        print_status "PASS" "Product listing successful"
    else
        print_status "FAIL" "Product listing failed"
    fi
    
    # Test product creation
    create_product_response=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$INVENTORY_SERVICE_URL/api/products" \
        -d '{
            "name":"Test Product",
            "description":"Integration test product",
            "price":29.99,
            "sku":"TEST-001",
            "category":"Electronics",
            "quantity":100
        }' 2>/dev/null)
    
    if echo "$create_product_response" | grep -q "id\|success"; then
        print_status "PASS" "Product creation successful"
        # Extract product ID for subsequent tests
        PRODUCT_ID=$(echo "$create_product_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        export PRODUCT_ID
    else
        print_status "FAIL" "Product creation failed"
    fi
}

# Test transaction processing
test_transaction_processing() {
    echo -e "\n${BLUE}Testing Transaction Processing...${NC}"
    
    if [ -z "$ACCESS_TOKEN" ] || [ -z "$PRODUCT_ID" ]; then
        print_status "FAIL" "Prerequisites not met for transaction tests"
        return 1
    fi
    
    # Test cart creation
    cart_response=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$TRANSACTION_SERVICE_URL/api/cart" \
        -d "{
            \"items\": [
                {
                    \"productId\": \"$PRODUCT_ID\",
                    \"quantity\": 2,
                    \"price\": 29.99
                }
            ]
        }" 2>/dev/null)
    
    if echo "$cart_response" | grep -q "cartId\|id"; then
        print_status "PASS" "Cart creation successful"
        CART_ID=$(echo "$cart_response" | grep -o '"cartId":"[^"]*' | cut -d'"' -f4)
        export CART_ID
    else
        print_status "FAIL" "Cart creation failed"
    fi
    
    # Test transaction creation
    if [ -n "$CART_ID" ]; then
        transaction_response=$(curl -s -X POST \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            "$TRANSACTION_SERVICE_URL/api/transactions" \
            -d "{
                \"cartId\": \"$CART_ID\",
                \"paymentMethod\": \"cash\",
                \"customerId\": \"test-customer\",
                \"total\": 59.98
            }" 2>/dev/null)
        
        if echo "$transaction_response" | grep -q "transactionId\|id"; then
            print_status "PASS" "Transaction creation successful"
        else
            print_status "FAIL" "Transaction creation failed"
        fi
    fi
}

# Test payment processing
test_payment_processing() {
    echo -e "\n${BLUE}Testing Payment Processing...${NC}"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_status "FAIL" "No access token available for payment tests"
        return 1
    fi
    
    # Test payment methods listing
    methods_response=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$PAYMENT_SERVICE_URL/api/payment-methods" 2>/dev/null)
    
    if echo "$methods_response" | grep -q "methods\|cash\|card"; then
        print_status "PASS" "Payment methods listing successful"
    else
        print_status "FAIL" "Payment methods listing failed"
    fi
    
    # Test mock payment processing
    payment_response=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$PAYMENT_SERVICE_URL/api/payments" \
        -d '{
            "amount": 59.98,
            "currency": "USD",
            "method": "cash",
            "transactionId": "test-transaction-123"
        }' 2>/dev/null)
    
    if echo "$payment_response" | grep -q "success\|completed"; then
        print_status "PASS" "Payment processing successful"
    else
        print_status "FAIL" "Payment processing failed"
    fi
}

# Test customer operations
test_customer_operations() {
    echo -e "\n${BLUE}Testing Customer Operations...${NC}"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_status "FAIL" "No access token available for customer tests"
        return 1
    fi
    
    # Test customer creation
    customer_response=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$CUSTOMER_SERVICE_URL/api/customers" \
        -d '{
            "name": "Test Customer",
            "email": "test@example.com",
            "phone": "+1234567890",
            "address": "123 Test Street, Test City"
        }' 2>/dev/null)
    
    if echo "$customer_response" | grep -q "id\|customerId"; then
        print_status "PASS" "Customer creation successful"
    else
        print_status "FAIL" "Customer creation failed"
    fi
    
    # Test customer listing
    customers_list_response=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$CUSTOMER_SERVICE_URL/api/customers" 2>/dev/null)
    
    if echo "$customers_list_response" | grep -q "customers\|items"; then
        print_status "PASS" "Customer listing successful"
    else
        print_status "FAIL" "Customer listing failed"
    fi
}

# Test notification system
test_notification_system() {
    echo -e "\n${BLUE}Testing Notification System...${NC}"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_status "FAIL" "No access token available for notification tests"
        return 1
    fi
    
    # Test notification creation
    notification_response=$(curl -s -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        "$NOTIFICATION_SERVICE_URL/api/notifications" \
        -d '{
            "type": "info",
            "title": "Test Notification",
            "message": "This is a test notification from integration tests",
            "userId": "test-user-123"
        }' 2>/dev/null)
    
    if echo "$notification_response" | grep -q "id\|success"; then
        print_status "PASS" "Notification creation successful"
    else
        print_status "FAIL" "Notification creation failed"
    fi
    
    # Test notification listing
    notifications_list_response=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$NOTIFICATION_SERVICE_URL/api/notifications" 2>/dev/null)
    
    if echo "$notifications_list_response" | grep -q "notifications\|items"; then
        print_status "PASS" "Notification listing successful"
    else
        print_status "FAIL" "Notification listing failed"
    fi
}

# Test reporting functionality
test_reporting() {
    echo -e "\n${BLUE}Testing Reporting Functionality...${NC}"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_status "FAIL" "No access token available for reporting tests"
        return 1
    fi
    
    # Test sales report
    sales_report_response=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$REPORTING_SERVICE_URL/api/reports/sales?period=daily" 2>/dev/null)
    
    if echo "$sales_report_response" | grep -q "report\|data\|sales"; then
        print_status "PASS" "Sales report generation successful"
    else
        print_status "FAIL" "Sales report generation failed"
    fi
    
    # Test inventory report
    inventory_report_response=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$REPORTING_SERVICE_URL/api/reports/inventory" 2>/dev/null)
    
    if echo "$inventory_report_response" | grep -q "report\|data\|inventory"; then
        print_status "PASS" "Inventory report generation successful"
    else
        print_status "FAIL" "Inventory report generation failed"
    fi
}

# Test database connectivity
test_database_connectivity() {
    echo -e "\n${BLUE}Testing Database Connectivity...${NC}"
    
    # Test PostgreSQL connection
    if command -v psql &> /dev/null; then
        if psql -h localhost -p 5432 -U cloudpos_user -d cloudpos -c "SELECT 1;" &> /dev/null; then
            print_status "PASS" "PostgreSQL connection successful"
        else
            print_status "FAIL" "PostgreSQL connection failed"
        fi
    else
        print_status "WARN" "psql not available, skipping PostgreSQL test"
    fi
    
    # Test MongoDB connection
    if command -v mongosh &> /dev/null; then
        if mongosh --host localhost:27017 --eval "db.adminCommand('ping')" &> /dev/null; then
            print_status "PASS" "MongoDB connection successful"
        else
            print_status "FAIL" "MongoDB connection failed"
        fi
    else
        print_status "WARN" "mongosh not available, skipping MongoDB test"
    fi
    
    # Test Redis connection
    if command -v redis-cli &> /dev/null; then
        if redis-cli -h localhost -p 6379 ping &> /dev/null; then
            print_status "PASS" "Redis connection successful"
        else
            print_status "FAIL" "Redis connection failed"
        fi
    else
        print_status "WARN" "redis-cli not available, skipping Redis test"
    fi
}

# Performance test
test_performance() {
    echo -e "\n${BLUE}Testing Performance...${NC}"
    
    if [ -z "$ACCESS_TOKEN" ]; then
        print_status "FAIL" "No access token available for performance tests"
        return 1
    fi
    
    # Test API response time
    start_time=$(date +%s%N)
    response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$INVENTORY_SERVICE_URL/api/products" 2>/dev/null)
    end_time=$(date +%s%N)
    
    duration_ms=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$response" == "200" ] && [ "$duration_ms" -lt 1000 ]; then
        print_status "PASS" "API response time acceptable (${duration_ms}ms)"
    elif [ "$response" == "200" ]; then
        print_status "WARN" "API response time slow (${duration_ms}ms)"
    else
        print_status "FAIL" "API performance test failed"
    fi
}

# Main test execution
main() {
    echo -e "\n${YELLOW}Starting CloudPOS Integration Tests...${NC}"
    
    # Wait for services to be ready
    echo -e "\n${BLUE}Waiting for services to start...${NC}"
    sleep 10
    
    # Run all tests
    test_service_health "API Gateway" "$API_BASE_URL"
    test_service_health "Auth Service" "$AUTH_SERVICE_URL"
    test_service_health "Inventory Service" "$INVENTORY_SERVICE_URL"
    test_service_health "Transaction Service" "$TRANSACTION_SERVICE_URL"
    test_service_health "Payment Service" "$PAYMENT_SERVICE_URL"
    test_service_health "Customer Service" "$CUSTOMER_SERVICE_URL"
    test_service_health "Notification Service" "$NOTIFICATION_SERVICE_URL"
    test_service_health "Reporting Service" "$REPORTING_SERVICE_URL"
    
    test_database_connectivity
    test_authentication
    test_inventory_operations
    test_transaction_processing
    test_payment_processing
    test_customer_operations
    test_notification_system
    test_reporting
    test_performance
    
    # Print test summary
    echo -e "\n${YELLOW}Test Summary${NC}"
    echo "============="
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    
    success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    echo -e "Success Rate: ${success_rate}%"
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "\n${GREEN}🎉 All tests passed! CloudPOS is ready for deployment.${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Some tests failed. Please review and fix issues before deployment.${NC}"
        exit 1
    fi
}

# Run tests
main "$@"