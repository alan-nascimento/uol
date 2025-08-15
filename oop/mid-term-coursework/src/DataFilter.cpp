#include "DataFilter.h"                       // Include filter header

std::vector<WeatherRecord> DataFilter::byDateRange(
    const std::vector<WeatherRecord>& data,
    const std::string& start,
    const std::string& end) {
    std::vector<WeatherRecord> out;           // Output vector
    for (auto& r : data) {                    // Iterate records
        std::string d = r.timestamp.substr(0, 10); // Extract date
        if (d >= start && d <= end)           // Check range
            out.push_back(r);                // Keep record
    }
    return out;                               // Return filtered
}

std::vector<WeatherRecord> DataFilter::byTempRange(
    const std::vector<WeatherRecord>& data,
    double minT, double maxT) {
    std::vector<WeatherRecord> out;
    for (auto& r : data)                      // Iterate records
        if (r.temperature >= minT && r.temperature <= maxT) // Check temp
            out.push_back(r);                // Keep record
    return out;                               // Return filtered
}
