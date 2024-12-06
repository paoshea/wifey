interface StatCardProps {
    label: string;
    value: number;
    icon: string;
    trend?: number;
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
    return (
        <div
            className="bg-white p-4 rounded-lg shadow-sm"
            role="region"
            aria-label={`${label} statistics`}
        >
            <div className="flex items-center justify-between">
                <span className="text-2xl" role="img" aria-label={`${label} icon`}>{icon}</span>
                {trend !== undefined && (
                    <div
                        className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        aria-label={`${trend >= 0 ? 'Increase' : 'Decrease'} of ${Math.abs(trend)}%`}
                    >
                        {trend > 0 && '+'}
                        {trend}%
                    </div>
                )}
            </div>
            <div className="mt-2">
                <div className="text-2xl font-bold" aria-label={`${label} value`}>
                    {value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">{label}</div>
            </div>
        </div>
    );
}
