import { useState, useMemo } from "react"

export type Filters<T> = Partial<Record<keyof T, string>>

function applyNumericFilter(field: number, filterValue: string): boolean {
    const trimmed = filterValue.trim()
    const match = trimmed.match(/^(<=|>=|<|>|=)?\s*(\d+(\.\d+)?)$/)
    if (!match) return true
    const operator = match[1] || "="
    const value = parseFloat(match[2])
    switch (operator) {
        case "<":  return field < value
        case "<=": return field <= value
        case ">":  return field > value
        case ">=": return field >= value
        case "=":  return field === value
        default:   return true
    }
}

export function useFilteredData<T>(data: T[]) {
    const [filters, setFilters] = useState<Filters<T>>({})

    const filteredData = useMemo(() => {
        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true
                const field = item[key as keyof T]
                if (typeof field === "string") {
                    return field.toLowerCase().includes((value as string).toLowerCase())
                }
                if (typeof field === "number") {
                    return applyNumericFilter(field, value as string)
                }
                return true
            })
        })
    }, [data, filters])

    function setFilter<K extends keyof T>(key: K, value: string) {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    function clearFilters() {
        setFilters({})
    }

    return { filters, setFilter, clearFilters, filteredData }
}