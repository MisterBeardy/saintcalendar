#!/bin/bash

# test_apis.sh - Interactive API testing script for Saint Calendar project
# Run with: ./scripts/testing/test_apis.sh
# Note: Make executable with: chmod +x scripts/testing/test_apis.sh
# Assumptions: jq installed for JSON parsing; replace <token> with actual auth token if needed
# Output: Logs to api_tests.log with status codes and summaries

BASE_URL="http://localhost:3000"
LOG_FILE="api_tests.log"

# Function to test API endpoints
test_api() {
    local method=${1:-GET}
    local endpoint=$2
    local section=$3
    local description=$4
    local data=$5
    local headers=""

    echo "$(date): [$section] $description - Method: $method" >> "$LOG_FILE"

    local curl_cmd="curl -s -w \"%{http_code}\""
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H \"Content-Type: application/json\""
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    curl_cmd="$curl_cmd -o /dev/null \"$BASE_URL$endpoint\""

    local status=$(eval $curl_cmd)
    echo "$(date): [$section] $description - Status: $status" >> "$LOG_FILE"

    if [ $status -eq 200 ] || [ $status -eq 201 ]; then
        echo "  ✓ Success for $endpoint ($method)" | tee -a "$LOG_FILE"
        return 0
    else
        echo "  ✗ Failed for $endpoint ($method) (status $status)" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Function to get response body
get_response() {
    local method=${1:-GET}
    local endpoint=$2
    local data=$3

    local curl_cmd="curl -s"
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H \"Content-Type: application/json\""
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    curl_cmd="$curl_cmd \"$BASE_URL$endpoint\""

    eval $curl_cmd
}

# Function to run all tests
run_all_tests() {
    echo "Starting API tests at $(date)" > "$LOG_FILE"

    # Home Section APIs
    echo "Testing Home Section APIs" | tee -a "$LOG_FILE"
    test_api "GET" "/api/events" "Home" "Fetch events" ""
    test_api "GET" "/api/saints" "Home" "Fetch saints" ""

    # Saints Section APIs
    echo "Testing Saints Section APIs" | tee -a "$LOG_FILE"
    test_api "GET" "/api/saints" "Saints" "Fetch saints list" ""
    test_api "GET" "/api/saints/123" "Saints" "Fetch saint by dummy ID 123" ""

    # Stickers Section APIs
    echo "Testing Stickers Section APIs" | tee -a "$LOG_FILE"
    test_api "GET" "/api/stickers" "Stickers" "Fetch stickers" ""
    test_api "GET" "/api/stickers/pending/count" "Stickers" "Fetch pending stickers count" ""

    # Stats Section APIs
    echo "Testing Stats Section APIs" | tee -a "$LOG_FILE"
    test_api "GET" "/api/saints/count" "Stats" "Fetch saints count" ""
    test_api "GET" "/api/locations/count" "Stats" "Fetch locations count" ""

    # Admin Section APIs (with placeholder auth)
    echo "Testing Admin Section APIs" | tee -a "$LOG_FILE"
    headers="-H 'Authorization: Bearer <token>'"
    test_api "GET" "/api/database/entries" "Admin" "Fetch database entries" "" "$headers"
    test_api "GET" "/api/pending-changes" "Admin" "Fetch pending changes" "" "$headers"

    echo "API tests completed. Check $LOG_FILE for details." | tee -a "$LOG_FILE"
    echo "Summary: $(grep -c '✓ Success' "$LOG_FILE") passed, $(grep -c '✗ Failed' "$LOG_FILE") failed"
}

# Function to run event generation tests
run_event_generation_tests() {
    echo "Starting Event Generation Tests at $(date)" | tee -a "$LOG_FILE"

    # Test 1: Generate events with saintNumber
    echo "Testing event generation with saintNumber parameter" | tee -a "$LOG_FILE"
    local response=$(get_response "POST" "/api/events/generate" '{"saintNumber": "1"}')
    echo "Response: $response" >> "$LOG_FILE"
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        local generated=$(echo "$response" | jq -r '.eventsGenerated')
        echo "  ✓ Generated $generated events for saintNumber 1" | tee -a "$LOG_FILE"
    else
        echo "  ✗ Failed to generate events for saintNumber 1" | tee -a "$LOG_FILE"
    fi

    # Test 2: Generate events with locationId (assuming location ID 1 exists)
    echo "Testing event generation with locationId parameter" | tee -a "$LOG_FILE"
    response=$(get_response "POST" "/api/events/generate" '{"locationId": "1"}')
    echo "Response: $response" >> "$LOG_FILE"
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        local generated=$(echo "$response" | jq -r '.eventsGenerated')
        echo "  ✓ Generated $generated events for locationId 1" | tee -a "$LOG_FILE"
    else
        echo "  ✗ Failed to generate events for locationId 1" | tee -a "$LOG_FILE"
    fi

    # Test 3: Generate events with empty parameters (all saints)
    echo "Testing event generation with empty parameters" | tee -a "$LOG_FILE"
    response=$(get_response "POST" "/api/events/generate" '{}')
    echo "Response: $response" >> "$LOG_FILE"
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        local generated=$(echo "$response" | jq -r '.eventsGenerated')
        echo "  ✓ Generated $generated events for all saints" | tee -a "$LOG_FILE"
    else
        echo "  ✗ Failed to generate events for all saints" | tee -a "$LOG_FILE"
    fi

    # Verification: Check generated events
    echo "Verifying generated events..." | tee -a "$LOG_FILE"
    local events_response=$(get_response "GET" "/api/events")
    local generated_count=$(echo "$events_response" | jq '[.[] | select(.eventType == "generated")] | length')
    local imported_count=$(echo "$events_response" | jq '[.[] | select(.eventType != "generated")] | length')

    echo "Generated events: $generated_count" | tee -a "$LOG_FILE"
    echo "Imported events: $imported_count" | tee -a "$LOG_FILE"

    if [ "$generated_count" -gt 0 ]; then
        echo "  ✓ Generated events found in database" | tee -a "$LOG_FILE"
    else
        echo "  ✗ No generated events found in database" | tee -a "$LOG_FILE"
    fi

    echo "Event Generation Tests completed. Check $LOG_FILE for details." | tee -a "$LOG_FILE"
}

# Function to run current month events test
run_current_month_events_test() {
    echo "Starting Current Month Events Test at $(date)" | tee -a "$LOG_FILE"

    # Calculate current month date range
    local current_year=$(date +%Y)
    local current_month=$(date +%m)
    local start_date="${current_year}-${current_month}-01"
    local end_date=$(date -d "${start_date} +1 month -1 day" +%Y-%m-%d)

    echo "Testing current month events: $start_date to $end_date" | tee -a "$LOG_FILE"
    echo "$(date): [Events] Testing current month events from $start_date to $end_date" >> "$LOG_FILE"

    # Make API call with date parameters
    local endpoint="/api/events?startDate=${start_date}&endDate=${end_date}"
    local response=$(get_response "GET" "$endpoint")

    # Log the response
    echo "Response: $response" >> "$LOG_FILE"

    # Check if response is valid JSON
    if echo "$response" | jq empty > /dev/null 2>&1; then
        local event_count=$(echo "$response" | jq length)
        echo "  ✓ Retrieved $event_count events for current month" | tee -a "$LOG_FILE"

        if [ "$event_count" -gt 0 ]; then
            echo "Events found:" | tee -a "$LOG_FILE"
            echo "$response" | jq -r '.[] | "  - \(.title) on \(.date) (\(.eventType))"' | tee -a "$LOG_FILE"
        else
            echo "  No events found for current month" | tee -a "$LOG_FILE"
        fi
    else
        echo "  ✗ Failed to parse response or invalid JSON" | tee -a "$LOG_FILE"
        echo "Raw response: $response" | tee -a "$LOG_FILE"
    fi

    echo "Current Month Events Test completed. Check $LOG_FILE for details." | tee -a "$LOG_FILE"
}

# Function to run section-specific tests
run_section_tests() {
    local section=$1
    echo "Starting $section Section Tests at $(date)" > "$LOG_FILE"

    case $section in
        "Home")
            echo "Testing Home Section APIs" | tee -a "$LOG_FILE"
            test_api "GET" "/api/events" "Home" "Fetch events" ""
            test_api "GET" "/api/saints" "Home" "Fetch saints" ""
            ;;
        "Saints")
            echo "Testing Saints Section APIs" | tee -a "$LOG_FILE"
            test_api "GET" "/api/saints" "Saints" "Fetch saints list" ""
            test_api "GET" "/api/saints/123" "Saints" "Fetch saint by dummy ID 123" ""
            ;;
        "Stickers")
            echo "Testing Stickers Section APIs" | tee -a "$LOG_FILE"
            test_api "GET" "/api/stickers" "Stickers" "Fetch stickers" ""
            test_api "GET" "/api/stickers/pending/count" "Stickers" "Fetch pending stickers count" ""
            ;;
        "Stats")
            echo "Testing Stats Section APIs" | tee -a "$LOG_FILE"
            test_api "GET" "/api/saints/count" "Stats" "Fetch saints count" ""
            test_api "GET" "/api/locations/count" "Stats" "Fetch locations count" ""
            ;;
        "Admin")
            echo "Testing Admin Section APIs" | tee -a "$LOG_FILE"
            headers="-H 'Authorization: Bearer <token>'"
            test_api "GET" "/api/database/entries" "Admin" "Fetch database entries" "" "$headers"
            test_api "GET" "/api/pending-changes" "Admin" "Fetch pending changes" "" "$headers"
            ;;
    esac

    echo "$section tests completed. Check $LOG_FILE for details." | tee -a "$LOG_FILE"
    echo "Summary: $(grep -c '✓ Success' "$LOG_FILE") passed, $(grep -c '✗ Failed' "$LOG_FILE") failed"
}

# Main menu
echo "=== Saint Calendar API Tester ==="
echo "Choose a test option:"
echo "1) Run All Tests"
echo "2) Home Section Tests"
echo "3) Saints Section Tests"
echo "4) Stickers Section Tests"
echo "5) Stats Section Tests"
echo "6) Admin Section Tests"
echo "7) Event Generation Tests"
echo "8) Current Month Events Test"
echo "9) Exit"
echo

read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        run_all_tests
        ;;
    2)
        run_section_tests "Home"
        ;;
    3)
        run_section_tests "Saints"
        ;;
    4)
        run_section_tests "Stickers"
        ;;
    5)
        run_section_tests "Stats"
        ;;
    6)
        run_section_tests "Admin"
        ;;
    7)
        run_event_generation_tests
        ;;
    8)
        run_current_month_events_test
        ;;
    9)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac