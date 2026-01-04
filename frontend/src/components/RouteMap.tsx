import { useState, useEffect } from "react";
import { MapContainer, Popup, TileLayer, Polyline, useMap, CircleMarker } from 'react-leaflet'
import { telemetryApiReport } from '@/services/api'
import './RouteMap.css'

export interface RouteMapProps {
    carId: number,
    routeColor?: string,
    markerSize?: number,
    defaultFromDate?: string,
    defaultToDate?: string,
    fromDate?: string,
    toDate?: string,
    onFromDateChange?: (date: string) => void,
    onToDateChange?: (date: string) => void,
}

const RouteMap: React.FC<RouteMapProps> = ({
    carId,
    routeColor = 'blue',
    markerSize = 2,
    defaultFromDate = "",
    defaultToDate = "",
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
}) => {
    const [routeDataError, setRouteDataError] = useState<string | null>(null)

    const [internalFromDate, setInternalFromDate] = useState<string>(defaultFromDate)
    const [internalToDate, setInternalToDate] = useState<string>(defaultToDate)
    
    const routeFromDate = fromDate !== undefined ? fromDate : internalFromDate
    const routeToDate = toDate !== undefined ? toDate : internalToDate
    
    const setRouteFromDate = (date: string) => {
        if (onFromDateChange) {
            onFromDateChange(date)
        } else {
            setInternalFromDate(date)
        }
    }
    
    const setRouteToDate = (date: string) => {
        if (onToDateChange) {
            onToDateChange(date)
        } else {
            setInternalToDate(date)
        }
    }

    const [routeData, setRouteData] = useState<any>(null)

    useEffect(() => {
        if (carId && routeFromDate && routeToDate) {
            fetchCarRouteData(carId, routeFromDate, routeToDate)
        } else {
            setRouteData(null)
            setRouteDataError(null)
        }
    }, [carId, routeFromDate, routeToDate])

    const translateError = (msg?: string) => {
        if (msg?.includes('No route data found for the specified period')) return 'No route data for the specified period'
        if (msg?.includes('invalid date')) return 'Invalid date'
        return 'An error occurred'
    }
    const validateDates = (fromIso: string, toIso: string) => {
        const fromDate = new Date(fromIso)
        const toDate = new Date(toIso)
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            setRouteDataError('Invalid date')
            return false
        }
        if (fromDate >= toDate) {
            setRouteDataError('Start date must be before end date')
            return false
        }
        return true
    }
    const fetchCarRouteData = async (carId: number, fromIso: string, toIso: string) => {
        try {
            const response = await telemetryApiReport.getRouteData(carId, new Date(fromIso), new Date(toIso))
            if (response) {
                setRouteData(response)
                setRouteDataError(null)
            }
        } catch (error) {
            setRouteDataError(translateError((error as Error).message))
            setRouteData(null)
        }
    }

    function RouteLayer({ points }: { points: any[] }) {

        const map = useMap()

        useEffect(() => {
            if (!points || points.length === 0) return
            const latlngs = points.map(p => [Number(p.latitude), Number(p.longitude)]) as [number, number][]
            map.fitBounds(latlngs, { padding: [40, 40] })
        }, [points, map])

        return (
            <>
                <Polyline positions={points.map(p => [Number(p.latitude), Number(p.longitude)])} pathOptions={{ color: routeColor }} />
                {points.map((p, i) => (
                    <CircleMarker
                        key={i}
                        center={[Number(p.latitude), Number(p.longitude)]}
                        radius={markerSize}
                        pathOptions={{ color: routeColor, fillColor: routeColor, fillOpacity: 0.9 }}
                        eventHandlers={{
                            mouseover: (e) => { (e.target as any).openPopup(); },
                            mouseout: (e) => { (e.target as any).closePopup(); },
                        }}
                    >
                        <Popup>
                            <div className="text-sm space-y-1">
                                <div>{new Date(p.timestamp).toLocaleString()}</div>
                                <div>Speed: {p.speedKmh ?? p.speed ?? '-'} km/h</div>
                                <div>Altitude: {p.altitude ?? '-'} m</div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </>
        )
    }

    return (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Route Map</h3>
                <p className="text-gray-400 text-sm">
                    Select start and end date and time to view the car's route during this period.
                </p>
            </div>
            {/* Date/time controls for route */}
            <div className="mb-4 flex flex-wrap items-end gap-3">
                <label className="text-sm">
                    <div className="text-xs text-gray-600">Start date and time</div>
                    <input type="hidden" id="timezone" name="timezone" value="-08:00" />
                    <input
                        type="datetime-local"
                        value={routeFromDate}
                        onChange={(e) => setRouteFromDate(e.target.value)}
                        className="border px-2 py-1 rounded"
                    />
                </label>
                <label className="text-sm">
                    <div className="text-xs text-gray-600">End date and time</div>
                    <input
                        type="datetime-local"
                        value={routeToDate}
                        onChange={(e) => { if (validateDates(routeFromDate, e.target.value)) setRouteToDate(e.target.value) }}
                        className="border px-2 py-1 rounded"
                    />
                </label>
                <div className="text-sm text-gray-500 ml-2">{routeData?.points?.length ?? 0} measurements</div>
                <div className="text-sm text-red-500 ml-2">{routeDataError}</div>
            </div>
            {/* Map for route */}
            <div id="map">
                <MapContainer
                    center={
                        routeData?.points && routeData.points.length > 0
                            ? [Number(routeData.points[0].latitude), Number(routeData.points[0].longitude)]
                            : [56.9496, 24.1052]
                    }
                    zoom={13}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {routeData?.points && routeData.points.length > 0 && (
                        <RouteLayer points={routeData.points} />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default RouteMap;