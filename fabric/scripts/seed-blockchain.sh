#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"

print_step() {
    echo -e "${GREEN}===> $1${NC}"
}

print_info() {
    echo -e "${YELLOW}$1${NC}"
}

submit_telemetry() {
    local carId="$1"
    local carData="$2"

    payload=$(jq -n --arg carId "$carId" --arg carData "$carData" \
        '{carId: $carId, carData: $carData}')

    response=$(curl -s -X POST "$API_URL/api/telemetry/submit" \
        -H "Content-Type: application/json" \
        -d "$payload")

    success=$(echo "$response" | jq -r '.success // false')
    if [ "$success" = "true" ]; then
        echo -e "  ${GREEN}OK${NC} - Car $carId"
    else
        echo -e "  ${YELLOW}FAIL${NC} - Car $carId: $(echo "$response" | jq -r '.error // "Unknown error"')"
    fi
}

print_step "Seeding Blockchain with Telemetry Data"
echo "API URL: $API_URL"
echo ""

print_step "Checking gateway health..."
health=$(curl -s "$API_URL/health" | jq -r '.status // "error"')
if [ "$health" != "ok" ]; then
    echo "Gateway is not healthy. Make sure it's running."
    exit 1
fi
echo "Gateway healthy"
echo ""

print_step "Seeding Car 1 (Toyota Camry) for John Doe" 

submit_telemetry "1" '{"SensorDataId": "seed-001", "VehicleId": "1", "Timestamp": "2025-11-28T09:52:16Z", "Latitude": 56.923034, "Longitude": 24.108351, "Altitude": 4.7, "GpsAccuracy": 2.13, "Heading": 0, "AccelerationX": 0.0, "AccelerationY": 0.0, "AccelerationZ": -0.0225, "SpeedKmh": 0, "EngineRpm": 757, "EngineTemperature": 59, "FuelLevel": 101.47, "OdometerKm": 50000, "ThrottlePosition": 20.0, "BrakePedal": false}'
submit_telemetry "1" '{"SensorDataId": "seed-002", "VehicleId": "1", "Timestamp": "2025-11-28T09:52:26Z", "Latitude": 56.92332, "Longitude": 24.108259, "Altitude": 4.8, "GpsAccuracy": 6.46, "Heading": 350.04, "AccelerationX": 0.0033, "AccelerationY": 0.0329, "AccelerationZ": -0.0413, "SpeedKmh": 11.62, "EngineRpm": 2551, "EngineTemperature": 60, "FuelLevel": 99.78, "OdometerKm": 50000.032, "ThrottlePosition": 36.58, "BrakePedal": false}'
submit_telemetry "1" '{"SensorDataId": "seed-003", "VehicleId": "1", "Timestamp": "2025-11-28T09:52:36Z", "Latitude": 56.923324, "Longitude": 24.108254, "Altitude": 4.8, "GpsAccuracy": 4.53, "Heading": 325.7, "AccelerationX": -0.0001, "AccelerationY": -0.0324, "AccelerationZ": -0.0473, "SpeedKmh": 0.19, "EngineRpm": 779, "EngineTemperature": 68, "FuelLevel": 100.74, "OdometerKm": 50000.033, "ThrottlePosition": 15.15, "BrakePedal": false}'
submit_telemetry "1" '{"SensorDataId": "seed-004", "VehicleId": "1", "Timestamp": "2025-11-28T09:52:46Z", "Latitude": 56.923401, "Longitude": 24.108122, "Altitude": 5.1, "GpsAccuracy": 3.21, "Heading": 315.2, "AccelerationX": 0.0125, "AccelerationY": 0.0221, "AccelerationZ": -0.0312, "SpeedKmh": 25.4, "EngineRpm": 1850, "EngineTemperature": 72, "FuelLevel": 99.12, "OdometerKm": 50000.104, "ThrottlePosition": 42.3, "BrakePedal": false}'
submit_telemetry "1" '{"SensorDataId": "seed-005", "VehicleId": "1", "Timestamp": "2025-11-28T09:52:56Z", "Latitude": 56.923512, "Longitude": 24.107985, "Altitude": 5.3, "GpsAccuracy": 2.87, "Heading": 310.8, "AccelerationX": 0.0089, "AccelerationY": 0.0156, "AccelerationZ": -0.0289, "SpeedKmh": 42.7, "EngineRpm": 2450, "EngineTemperature": 78, "FuelLevel": 98.45, "OdometerKm": 50000.223, "ThrottlePosition": 55.2, "BrakePedal": false}'
submit_telemetry "1" '{"SensorDataId": "seed-006", "VehicleId": "1", "Timestamp": "2025-11-28T09:53:06Z", "Latitude": 56.923687, "Longitude": 24.107801, "Altitude": 5.5, "GpsAccuracy": 2.45, "Heading": 305.4, "AccelerationX": -0.0045, "AccelerationY": -0.0123, "AccelerationZ": -0.0198, "SpeedKmh": 58.3, "EngineRpm": 2890, "EngineTemperature": 82, "FuelLevel": 97.89, "OdometerKm": 50000.385, "ThrottlePosition": 48.7, "BrakePedal": false}'
submit_telemetry "1" '{"SensorDataId": "seed-007", "VehicleId": "1", "Timestamp": "2025-11-28T09:53:16Z", "Latitude": 56.923845, "Longitude": 24.107623, "Altitude": 5.8, "GpsAccuracy": 2.12, "Heading": 298.6, "AccelerationX": -0.0178, "AccelerationY": -0.0256, "AccelerationZ": -0.0145, "SpeedKmh": 45.2, "EngineRpm": 2100, "EngineTemperature": 85, "FuelLevel": 97.21, "OdometerKm": 50000.511, "ThrottlePosition": 32.1, "BrakePedal": true}'
submit_telemetry "1" '{"SensorDataId": "seed-008", "VehicleId": "1", "Timestamp": "2025-11-28T09:53:26Z", "Latitude": 56.923956, "Longitude": 24.107489, "Altitude": 6.0, "GpsAccuracy": 1.98, "Heading": 292.3, "AccelerationX": -0.0234, "AccelerationY": -0.0312, "AccelerationZ": -0.0089, "SpeedKmh": 28.9, "EngineRpm": 1450, "EngineTemperature": 86, "FuelLevel": 96.78, "OdometerKm": 50000.589, "ThrottlePosition": 18.5, "BrakePedal": true}'
submit_telemetry "1" '{"SensorDataId": "seed-009", "VehicleId": "1", "Timestamp": "2025-11-28T09:53:36Z", "Latitude": 56.924012, "Longitude": 24.107398, "Altitude": 6.1, "GpsAccuracy": 1.76, "Heading": 288.1, "AccelerationX": -0.0089, "AccelerationY": -0.0145, "AccelerationZ": -0.0056, "SpeedKmh": 12.4, "EngineRpm": 890, "EngineTemperature": 87, "FuelLevel": 96.45, "OdometerKm": 50000.624, "ThrottlePosition": 12.3, "BrakePedal": true}'
submit_telemetry "1" '{"SensorDataId": "seed-010", "VehicleId": "1", "Timestamp": "2025-11-28T09:53:46Z", "Latitude": 56.924045, "Longitude": 24.107356, "Altitude": 6.2, "GpsAccuracy": 1.54, "Heading": 285.7, "AccelerationX": 0.0, "AccelerationY": 0.0, "AccelerationZ": -0.0023, "SpeedKmh": 0, "EngineRpm": 750, "EngineTemperature": 88, "FuelLevel": 96.12, "OdometerKm": 50000.638, "ThrottlePosition": 8.0, "BrakePedal": false}'

echo ""

print_step "Seeding Car 2 (Honda Civic) for Jane Smith"

submit_telemetry "2" '{"SensorDataId": "seed-011", "VehicleId": "2", "Timestamp": "2025-11-28T10:15:00Z", "Latitude": 56.951234, "Longitude": 24.125678, "Altitude": 12.3, "GpsAccuracy": 2.45, "Heading": 45.0, "AccelerationX": 0.0, "AccelerationY": 0.0, "AccelerationZ": -0.0198, "SpeedKmh": 0, "EngineRpm": 820, "EngineTemperature": 45, "FuelLevel": 78.5, "OdometerKm": 22000, "ThrottlePosition": 15.0, "BrakePedal": false}'
submit_telemetry "2" '{"SensorDataId": "seed-012", "VehicleId": "2", "Timestamp": "2025-11-28T10:15:10Z", "Latitude": 56.951456, "Longitude": 24.125890, "Altitude": 12.5, "GpsAccuracy": 3.12, "Heading": 48.2, "AccelerationX": 0.0156, "AccelerationY": 0.0234, "AccelerationZ": -0.0287, "SpeedKmh": 18.5, "EngineRpm": 2100, "EngineTemperature": 52, "FuelLevel": 78.2, "OdometerKm": 22000.051, "ThrottlePosition": 38.5, "BrakePedal": false}'
submit_telemetry "2" '{"SensorDataId": "seed-013", "VehicleId": "2", "Timestamp": "2025-11-28T10:15:20Z", "Latitude": 56.951789, "Longitude": 24.126234, "Altitude": 12.8, "GpsAccuracy": 2.78, "Heading": 52.6, "AccelerationX": 0.0089, "AccelerationY": 0.0178, "AccelerationZ": -0.0312, "SpeedKmh": 35.8, "EngineRpm": 2650, "EngineTemperature": 62, "FuelLevel": 77.8, "OdometerKm": 22000.151, "ThrottlePosition": 52.3, "BrakePedal": false}'
submit_telemetry "2" '{"SensorDataId": "seed-014", "VehicleId": "2", "Timestamp": "2025-11-28T10:15:30Z", "Latitude": 56.952123, "Longitude": 24.126678, "Altitude": 13.1, "GpsAccuracy": 2.34, "Heading": 55.8, "AccelerationX": 0.0045, "AccelerationY": 0.0123, "AccelerationZ": -0.0256, "SpeedKmh": 52.4, "EngineRpm": 3100, "EngineTemperature": 72, "FuelLevel": 77.3, "OdometerKm": 22000.296, "ThrottlePosition": 65.8, "BrakePedal": false}'
submit_telemetry "2" '{"SensorDataId": "seed-015", "VehicleId": "2", "Timestamp": "2025-11-28T10:15:40Z", "Latitude": 56.952567, "Longitude": 24.127123, "Altitude": 13.4, "GpsAccuracy": 2.01, "Heading": 58.2, "AccelerationX": 0.0012, "AccelerationY": 0.0089, "AccelerationZ": -0.0198, "SpeedKmh": 68.7, "EngineRpm": 3450, "EngineTemperature": 78, "FuelLevel": 76.7, "OdometerKm": 22000.487, "ThrottlePosition": 58.2, "BrakePedal": false}'
submit_telemetry "2" '{"SensorDataId": "seed-016", "VehicleId": "2", "Timestamp": "2025-11-28T10:15:50Z", "Latitude": 56.953012, "Longitude": 24.127678, "Altitude": 13.7, "GpsAccuracy": 1.89, "Heading": 60.5, "AccelerationX": -0.0034, "AccelerationY": -0.0078, "AccelerationZ": -0.0145, "SpeedKmh": 72.3, "EngineRpm": 3200, "EngineTemperature": 82, "FuelLevel": 76.1, "OdometerKm": 22000.688, "ThrottlePosition": 52.1, "BrakePedal": false}'
submit_telemetry "2" '{"SensorDataId": "seed-017", "VehicleId": "2", "Timestamp": "2025-11-28T10:16:00Z", "Latitude": 56.953456, "Longitude": 24.128234, "Altitude": 14.0, "GpsAccuracy": 1.76, "Heading": 62.8, "AccelerationX": -0.0156, "AccelerationY": -0.0234, "AccelerationZ": -0.0098, "SpeedKmh": 58.9, "EngineRpm": 2700, "EngineTemperature": 84, "FuelLevel": 75.6, "OdometerKm": 22000.889, "ThrottlePosition": 35.6, "BrakePedal": true}'
submit_telemetry "2" '{"SensorDataId": "seed-018", "VehicleId": "2", "Timestamp": "2025-11-28T10:16:10Z", "Latitude": 56.953789, "Longitude": 24.128678, "Altitude": 14.2, "GpsAccuracy": 1.65, "Heading": 64.1, "AccelerationX": -0.0212, "AccelerationY": -0.0298, "AccelerationZ": -0.0067, "SpeedKmh": 38.5, "EngineRpm": 1850, "EngineTemperature": 85, "FuelLevel": 75.2, "OdometerKm": 22000.996, "ThrottlePosition": 22.3, "BrakePedal": true}'
submit_telemetry "2" '{"SensorDataId": "seed-019", "VehicleId": "2", "Timestamp": "2025-11-28T10:16:20Z", "Latitude": 56.954012, "Longitude": 24.129012, "Altitude": 14.4, "GpsAccuracy": 1.54, "Heading": 65.4, "AccelerationX": -0.0098, "AccelerationY": -0.0156, "AccelerationZ": -0.0034, "SpeedKmh": 15.2, "EngineRpm": 1100, "EngineTemperature": 86, "FuelLevel": 74.9, "OdometerKm": 22001.039, "ThrottlePosition": 12.5, "BrakePedal": true}'
submit_telemetry "2" '{"SensorDataId": "seed-020", "VehicleId": "2", "Timestamp": "2025-11-28T10:16:30Z", "Latitude": 56.954123, "Longitude": 24.129156, "Altitude": 14.5, "GpsAccuracy": 1.45, "Heading": 66.0, "AccelerationX": 0.0, "AccelerationY": 0.0, "AccelerationZ": -0.0019, "SpeedKmh": 0, "EngineRpm": 780, "EngineTemperature": 87, "FuelLevel": 74.6, "OdometerKm": 22001.052, "ThrottlePosition": 8.0, "BrakePedal": false}'

echo ""

print_step "Seeding Car 3 (Tesla Model 3) For Jane Smith"

submit_telemetry "3" '{"SensorDataId": "seed-021", "VehicleId": "3", "Timestamp": "2025-11-28T14:30:00Z", "Latitude": 56.945678, "Longitude": 24.098765, "Altitude": 8.5, "GpsAccuracy": 1.23, "Heading": 180.0, "AccelerationX": 0.0, "AccelerationY": 0.0, "AccelerationZ": -0.0156, "SpeedKmh": 0, "EngineRpm": 0, "EngineTemperature": 25, "FuelLevel": 85.0, "OdometerKm": 8000, "ThrottlePosition": 0.0, "BrakePedal": false}'
submit_telemetry "3" '{"SensorDataId": "seed-022", "VehicleId": "3", "Timestamp": "2025-11-28T14:30:10Z", "Latitude": 56.945456, "Longitude": 24.098543, "Altitude": 8.7, "GpsAccuracy": 1.45, "Heading": 182.5, "AccelerationX": 0.0345, "AccelerationY": 0.0123, "AccelerationZ": -0.0234, "SpeedKmh": 28.5, "EngineRpm": 0, "EngineTemperature": 28, "FuelLevel": 84.8, "OdometerKm": 8000.079, "ThrottlePosition": 45.0, "BrakePedal": false}'
submit_telemetry "3" '{"SensorDataId": "seed-023", "VehicleId": "3", "Timestamp": "2025-11-28T14:30:20Z", "Latitude": 56.945123, "Longitude": 24.098234, "Altitude": 9.0, "GpsAccuracy": 1.34, "Heading": 185.2, "AccelerationX": 0.0234, "AccelerationY": 0.0089, "AccelerationZ": -0.0312, "SpeedKmh": 58.7, "EngineRpm": 0, "EngineTemperature": 32, "FuelLevel": 84.5, "OdometerKm": 8000.242, "ThrottlePosition": 62.5, "BrakePedal": false}'
submit_telemetry "3" '{"SensorDataId": "seed-024", "VehicleId": "3", "Timestamp": "2025-11-28T14:30:30Z", "Latitude": 56.944678, "Longitude": 24.097890, "Altitude": 9.3, "GpsAccuracy": 1.21, "Heading": 187.8, "AccelerationX": 0.0156, "AccelerationY": 0.0067, "AccelerationZ": -0.0267, "SpeedKmh": 85.2, "EngineRpm": 0, "EngineTemperature": 35, "FuelLevel": 84.1, "OdometerKm": 8000.479, "ThrottlePosition": 75.8, "BrakePedal": false}'
submit_telemetry "3" '{"SensorDataId": "seed-025", "VehicleId": "3", "Timestamp": "2025-11-28T14:30:40Z", "Latitude": 56.944123, "Longitude": 24.097456, "Altitude": 9.6, "GpsAccuracy": 1.12, "Heading": 190.4, "AccelerationX": 0.0078, "AccelerationY": 0.0034, "AccelerationZ": -0.0198, "SpeedKmh": 102.5, "EngineRpm": 0, "EngineTemperature": 38, "FuelLevel": 83.6, "OdometerKm": 8000.764, "ThrottlePosition": 68.2, "BrakePedal": false}'
submit_telemetry "3" '{"SensorDataId": "seed-026", "VehicleId": "3", "Timestamp": "2025-11-28T14:30:50Z", "Latitude": 56.943567, "Longitude": 24.097012, "Altitude": 9.8, "GpsAccuracy": 1.08, "Heading": 192.1, "AccelerationX": -0.0045, "AccelerationY": -0.0023, "AccelerationZ": -0.0145, "SpeedKmh": 98.3, "EngineRpm": 0, "EngineTemperature": 40, "FuelLevel": 83.1, "OdometerKm": 8001.037, "ThrottlePosition": 55.6, "BrakePedal": false}'
submit_telemetry "3" '{"SensorDataId": "seed-027", "VehicleId": "3", "Timestamp": "2025-11-28T14:31:00Z", "Latitude": 56.943012, "Longitude": 24.096567, "Altitude": 10.1, "GpsAccuracy": 1.02, "Heading": 194.5, "AccelerationX": -0.0267, "AccelerationY": -0.0156, "AccelerationZ": -0.0089, "SpeedKmh": 72.1, "EngineRpm": 0, "EngineTemperature": 42, "FuelLevel": 82.7, "OdometerKm": 8001.274, "ThrottlePosition": 28.4, "BrakePedal": true}'
submit_telemetry "3" '{"SensorDataId": "seed-028", "VehicleId": "3", "Timestamp": "2025-11-28T14:31:10Z", "Latitude": 56.942567, "Longitude": 24.096234, "Altitude": 10.3, "GpsAccuracy": 0.98, "Heading": 196.2, "AccelerationX": -0.0389, "AccelerationY": -0.0234, "AccelerationZ": -0.0045, "SpeedKmh": 42.8, "EngineRpm": 0, "EngineTemperature": 43, "FuelLevel": 82.4, "OdometerKm": 8001.393, "ThrottlePosition": 12.5, "BrakePedal": true}'
submit_telemetry "3" '{"SensorDataId": "seed-029", "VehicleId": "3", "Timestamp": "2025-11-28T14:31:20Z", "Latitude": 56.942234, "Longitude": 24.096012, "Altitude": 10.5, "GpsAccuracy": 0.95, "Heading": 197.8, "AccelerationX": -0.0178, "AccelerationY": -0.0123, "AccelerationZ": -0.0023, "SpeedKmh": 18.5, "EngineRpm": 0, "EngineTemperature": 44, "FuelLevel": 82.1, "OdometerKm": 8001.444, "ThrottlePosition": 5.2, "BrakePedal": true}'
submit_telemetry "3" '{"SensorDataId": "seed-030", "VehicleId": "3", "Timestamp": "2025-11-28T14:31:30Z", "Latitude": 56.942012, "Longitude": 24.095890, "Altitude": 10.6, "GpsAccuracy": 0.92, "Heading": 198.5, "AccelerationX": 0.0, "AccelerationY": 0.0, "AccelerationZ": -0.0012, "SpeedKmh": 0, "EngineRpm": 0, "EngineTemperature": 45, "FuelLevel": 81.9, "OdometerKm": 8001.465, "ThrottlePosition": 0.0, "BrakePedal": false}'

echo ""

print_step "Seeding complete!"
echo ""

echo "Car 1 records:"
curl -s "$API_URL/api/telemetry/vehicle/1" | jq 'length'

echo "Car 2 records:"
curl -s "$API_URL/api/telemetry/vehicle/2" | jq 'length'

echo "Car 3 records:"
curl -s "$API_URL/api/telemetry/vehicle/3" | jq 'length'

echo ""
echo "Total records:"
curl -s "$API_URL/api/telemetry/all" | jq 'length'

echo ""
print_step "Blockchain seeded"
