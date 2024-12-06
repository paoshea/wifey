import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export interface ActivityDataPoint {
    date: string;
    measurements: number;
    ruralMeasurements: number;
    uniqueLocations: number;
}

interface ActivityChartProps {
    data: ActivityDataPoint[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div
                className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500"
                role="alert"
                aria-label="No activity data available"
            >
                No activity data available
            </div>
        );
    }

    return (
        <div
            className="bg-white p-6 rounded-lg shadow-sm"
            role="region"
            aria-label="Activity Overview Chart"
        >
            <h3 className="text-lg font-bold mb-4">Activity Overview</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        aria-label="Activity metrics over time"
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}
                            aria-label="Timeline"
                        />
                        <YAxis aria-label="Measurement count" />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div
                                            className="bg-white p-3 rounded shadow-lg border"
                                            role="tooltip"
                                            aria-live="polite"
                                        >
                                            <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
                                            {payload.map((entry) => (
                                                <p
                                                    key={entry.name}
                                                    style={{ color: entry.color }}
                                                    aria-label={`${entry.name}: ${entry.value}`}
                                                >
                                                    {entry.name}: {entry.value}
                                                </p>
                                            ))}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="measurements"
                            stroke="#3B82F6"
                            name="Total Measurements"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            aria-label="Total measurements trend line"
                        />
                        <Line
                            type="monotone"
                            dataKey="ruralMeasurements"
                            stroke="#10B981"
                            name="Rural Measurements"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            aria-label="Rural measurements trend line"
                        />
                        <Line
                            type="monotone"
                            dataKey="uniqueLocations"
                            stroke="#8B5CF6"
                            name="Unique Locations"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            aria-label="Unique locations trend line"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
